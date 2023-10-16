import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Observable, Subject, concatAll, finalize, from, map, of, startWith, takeUntil } from 'rxjs'
import { SemVer, coerce } from 'semver'
import { Agent, AgentConnectionMessage, AgentTokenReplacement, CreateAgentOptions } from 'src/domain/agent'
import AgentInstaller from 'src/domain/agent-installer'
import { AgentToken, generateAgentToken } from 'src/domain/agent-token'
import { BasicNode } from 'src/domain/node'
import { CruxBadRequestException, CruxConflictException, CruxNotFoundException } from 'src/exception/crux-exception'
import {
  AgentCommand,
  AgentInfo,
  CloseReason,
  ContainerDeleteRequest,
  ContainerInspectMessage,
  ContainerLogMessage,
  ContainerStateListMessage,
  Empty,
} from 'src/grpc/protobuf/proto/agent'
import PrismaService from 'src/services/prisma.service'
import GrpcNodeConnection from 'src/shared/grpc-node-connection'
import { getPackageVersion } from 'src/shared/package'
import { AGENT_SUPPORTED_MINIMUM_VERSION } from '../../shared/const'
import { NodeConnectionStatus, NodeEventTypeEnum, NodeScriptTypeDto } from '../node/node.dto'
import { AgentKickReason } from './agent.dto'

@Injectable()
export default class AgentService {
  private readonly logger = new Logger(AgentService.name)

  private installers: Map<string, AgentInstaller> = new Map()

  private agents: Map<string, Agent> = new Map()

  private eventChannel: Subject<AgentConnectionMessage> = new Subject()

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  getById(id: string): Agent {
    return this.agents.get(id)
  }

  getByIdOrThrow(id: string): Agent {
    const agent = this.getById(id)
    if (!agent) {
      throw new CruxNotFoundException({
        message: 'Agent not found',
        property: 'agent',
        value: id,
      })
    }

    return agent
  }

  getInstallerByNodeId(nodeId: string): AgentInstaller {
    const installer = this.installers.get(nodeId)

    if (installer?.expired) {
      this.installers.delete(nodeId)
      this.logger.debug(`Installer for node ${nodeId} is expired.`)
      return null
    }

    return installer
  }

  getNodeEvents(): Subject<AgentConnectionMessage> {
    return this.eventChannel
  }

  async startInstallation(
    node: BasicNode,
    scriptType: NodeScriptTypeDto,
    hostAddress: string | null,
  ): Promise<AgentInstaller> {
    let installer = this.getInstallerByNodeId(node.id)
    if (installer) {
      if (!installer.expired) {
        // the installer is valid and still the same node type

        return installer
      }

      this.installers.delete(node.id)
    }

    // generate new installer
    const token = generateAgentToken(node.id, hostAddress)

    installer = new AgentInstaller(this.configService, node, {
      token,
      signedToken: this.jwtService.sign(token),
      scriptType,
    })

    await this.prisma.node.update({
      where: {
        id: node.id,
      },
      data: {
        tokenNonce: token.nonce,
      },
    })

    this.installers.set(node.id, installer)

    return installer
  }

  discardInstaller(nodeId: string) {
    this.installers.delete(nodeId)
  }

  async completeInstaller(installer: AgentInstaller) {
    this.installers.delete(installer.node.id)
    await this.createAgentAudit(installer.node.id, 'installed')
  }

  async kick(nodeId: string, reason: AgentKickReason): Promise<void> {
    const agent = this.getById(nodeId)
    agent?.close(CloseReason.SHUTDOWN)

    await this.createAgentAudit(nodeId, 'kicked', {
      reason,
    })
  }

  handleConnect(connection: GrpcNodeConnection, request: AgentInfo): Observable<AgentCommand> {
    return from(this.onAgentConnected(connection, request)).pipe(concatAll())
  }

  handleContainerState(
    connection: GrpcNodeConnection,
    request: Observable<ContainerStateListMessage>,
  ): Observable<Empty> {
    const agent = this.getByIdOrThrow(connection.nodeId)

    const [watcher, completer] = agent.onContainerStateStreamStarted()
    if (!watcher) {
      this.logger.warn(`${agent.id} - There was no watcher`)

      completer.next(undefined)
      return completer
    }

    return request.pipe(
      // necessary, because of: https://github.com/nestjs/nest/issues/8111
      startWith({
        data: [],
      }),
      map(it => {
        this.logger.verbose(`${agent.id} - Container status update`)

        watcher.update(it)
        return Empty
      }),
      finalize(() => {
        agent.onContainerStatusStreamFinished()
        this.logger.debug(`${agent.id} - Container status listening finished`)
      }),
      takeUntil(completer),
    )
  }

  containersDeleted(connection: GrpcNodeConnection, request: ContainerDeleteRequest): Empty {
    this.logger.log(`Containers deleted on '${connection.nodeId}'`)

    const agent = this.getByIdOrThrow(connection.nodeId)
    agent.onContainerDeleted(request)

    return Empty
  }

  handleContainerLog(connection: GrpcNodeConnection, request: Observable<ContainerLogMessage>): Observable<Empty> {
    const agent = this.getByIdOrThrow(connection.nodeId)

    const key = connection.getStringMetadata(GrpcNodeConnection.META_CONTAINER_NAME)

    const [stream, completer] = agent.onContainerLogStreamStarted(key)
    if (!stream) {
      this.logger.warn(`${agent.id} - There was no stream for ${key}`)

      return of(Empty)
    }

    return request.pipe(
      // necessary, because of: https://github.com/nestjs/nest/issues/8111
      startWith({
        log: '',
      } as ContainerLogMessage),
      map(it => {
        this.logger.verbose(`${agent.id} - Container log - '${key}' -> '${it.log}'`)

        stream.update(it)
        return Empty
      }),
      finalize(() => {
        agent.onContainerLogStreamFinished(key)
        this.logger.debug(`${agent.id} - Container log listening finished: ${key}`)
      }),
      takeUntil(completer),
    )
  }

  handleContainerInspect(connection: GrpcNodeConnection, request: ContainerInspectMessage): Observable<Empty> {
    const agent = this.getByIdOrThrow(connection.nodeId)

    agent.onContainerInspect(request)

    return of(Empty)
  }

  agentVersionSupported(version: string): boolean {
    const agentVersion = this.getAgentSemVer(version)
    if (!agentVersion) {
      return false
    }

    const packageVersion = coerce(getPackageVersion(this.configService))

    return (
      agentVersion.compare(AGENT_SUPPORTED_MINIMUM_VERSION) >= 0 && // agent version is newer (bigger) or the same
      agentVersion.compare(packageVersion) <= 0
    )
  }

  agentVersionIsUpToDate(version: string): boolean {
    const agentVersion = this.getAgentSemVer(version)
    if (!agentVersion) {
      return false
    }

    const packageVersion = coerce(getPackageVersion(this.configService))

    return agentVersion.compare(packageVersion) === 0
  }

  generateConnectionTokenFor(nodeId: string): AgentTokenReplacement {
    const token = generateAgentToken(nodeId, 'connection')
    const signedToken = this.jwtService.sign(token)

    return {
      signedToken,
      token,
    }
  }

  private getAgentSemVer(version: string): SemVer | null {
    if (!version.includes('-')) {
      return null
    }

    const semver = coerce(version)
    if (!semver) {
      return null
    }

    return semver
  }

  private async onAgentConnectionStatusChange(agent: Agent, status: NodeConnectionStatus) {
    if (status === 'unreachable') {
      const storedAgent = this.agents.get(agent.id)

      // there should be no awaits between this and the agents.delete() call
      // so we can be sure it happens in the same microtask
      if (agent === storedAgent) {
        this.logger.log(`Left: ${agent.id}, version: ${agent.version}`)
        this.agents.delete(agent.id)

        await this.createAgentAudit(agent.id, 'left')
      }

      agent.onDisconnected()
    } else if (status === 'connected' || status === 'outdated') {
      if (this.agents.has(agent.id)) {
        this.logger.warn(
          `Agent connection divergence: ${agent.id} was emitting a ${status} status, while there was an agent with the same ID already connected. Sending shutdown.`,
        )

        agent.close(CloseReason.SHUTDOWN)
        return
      }

      this.agents.set(agent.id, agent)

      this.logger.log(`Agent joined with id: ${agent.id}, version: ${agent.version}`)
      this.logServiceInfo()

      await this.createAgentAudit(agent.id, 'connected', agent.info)
    } else {
      this.logger.warn(`Unknown NodeConnectionStatus ${status}`)
    }
  }

  private async onAgentConnected(
    connection: GrpcNodeConnection,
    request: AgentInfo,
  ): Promise<Observable<AgentCommand>> {
    const token = this.jwtService.decode(connection.jwt) as AgentToken

    const nodeId = token.sub
    if (request.id !== nodeId) {
      throw new CruxBadRequestException({
        message: 'Node id mismatch.',
      })
    }

    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
      },
    })
    if (!node) {
      throw new CruxBadRequestException({
        message: 'Node not found.',
      })
    }

    const connectedAgent = this.getById(nodeId)
    if (connectedAgent) {
      throw new CruxConflictException({
        message: 'Agent is already connected.',
        property: 'id',
      })
    }

    const outdated = !this.agentVersionSupported(request.version)
    if (outdated) {
      this.logger.warn(
        `Agent ('${request.id}') connected with unsupported version '${
          request.version
        }', package is '${getPackageVersion(this.configService)}'`,
      )
    }

    const agent = await this.createAgent({
      connection,
      info: request,
      node,
      outdated,
    })

    await this.onAgentConnectionStatusChange(agent, agent.outdated ? 'outdated' : 'connected')

    return agent.onConnected(it => this.onAgentConnectionStatusChange(agent, it))
  }

  public async createAgentAudit(nodeId: string, event: NodeEventTypeEnum, data?: any) {
    try {
      await this.prisma.nodeEvent.create({
        data: {
          nodeId,
          event,
          data: data ? JSON.stringify(data) : undefined,
        },
      })
    } catch (err) {
      if (event === 'kicked' || event === 'left') {
        // When an agent is deleted we cannot insert an AgentEvent for it anymore
        return
      }
      throw err
    }
  }

  protected async createAgent(options: CreateAgentOptions): Promise<Agent> {
    const { connection, node } = options

    const eventChannel = await this.getNodeEvents()
    const agent = new Agent({
      ...options,
      eventChannel,
    })

    await this.prisma.node.update({
      where: { id: node.id },
      data: {
        address: connection.address,
        connectedAt: connection.connectedAt,
      },
    })

    return agent
  }

  private logServiceInfo(): void {
    this.logger.verbose(`Agents: ${this.agents.size}`)
    this.agents.forEach(it => it.debugInfo(this.logger))
  }
}
