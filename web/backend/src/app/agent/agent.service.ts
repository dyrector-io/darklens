import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Observable, Subject, concatAll, finalize, from, map, of, startWith, takeUntil } from 'rxjs'
import { SemVer, coerce } from 'semver'
import { Agent, AgentConnectionMessage, AgentTokenReplacement } from 'src/domain/agent'
import AgentInstaller from 'src/domain/agent-installer'
import { generateAgentToken } from 'src/domain/agent-token'
import { BasicNode } from 'src/domain/node'
import { CruxNotFoundException } from 'src/exception/crux-exception'
import { AgentAbortUpdate, AgentCommand, AgentInfo, CloseReason } from 'src/grpc/protobuf/proto/agent'
import {
  ContainerIdentifier,
  ContainerInspectMessage,
  ContainerLogMessage,
  ContainerStateListMessage,
  DeleteContainersRequest,
  Empty,
} from 'src/grpc/protobuf/proto/common'
import PrismaService from 'src/services/prisma.service'
import GrpcNodeConnection from 'src/shared/grpc-node-connection'
import { getAgentVersionFromPackage, getPackageVersion } from 'src/shared/package'
import { AGENT_SUPPORTED_MINIMUM_VERSION } from '../../shared/const'
import { DagentTraefikOptionsDto, NodeConnectionStatus, NodeEventTypeEnum, NodeScriptTypeDto } from '../node/node.dto'
import AgentConnectionStrategyProvider from './agent.connection-strategy.provider'
import { AgentKickReason } from './agent.dto'
import AgentConnectionLegacyStrategy from './connection-strategies/agent.connection.legacy.strategy'

@Injectable()
export default class AgentService {
  private readonly logger = new Logger(AgentService.name)

  private installers: Map<string, AgentInstaller> = new Map()

  private agents: Map<string, Agent> = new Map()

  private eventChannel: Subject<AgentConnectionMessage> = new Subject()

  constructor(
    @Inject(forwardRef(() => AgentConnectionStrategyProvider))
    private readonly connectionStrategies: AgentConnectionStrategyProvider,
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
    rootPath: string | null,
    scriptType: NodeScriptTypeDto,
    traefik: DagentTraefikOptionsDto | null,
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
    const token = generateAgentToken(node.id, 'install')

    installer = new AgentInstaller(this.configService, node, {
      token,
      signedToken: this.jwtService.sign(token),
      rootPath,
      scriptType,
      dagentTraefikAcmeEmail: traefik?.acmeEmail,
    })

    this.installers.set(node.id, installer)

    return installer
  }

  async discardInstaller(nodeId: string): Promise<Empty> {
    if (!this.installers.has(nodeId)) {
      throw new CruxNotFoundException({
        message: 'Installer not found',
        property: 'installer',
        value: nodeId,
      })
    }

    this.installers.delete(nodeId)

    return Empty
  }

  async completeInstaller(installer: AgentInstaller) {
    this.installers.delete(installer.node.id)
    await this.createAgentAudit(installer.node.id, 'installed')
  }

  async kick(nodeId: string, reason: AgentKickReason): Promise<void> {
    const agent = this.getById(nodeId)
    agent?.close(reason === 'revoke-token' ? CloseReason.REVOKE_TOKEN : CloseReason.SHUTDOWN)

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
    const prefix = connection.getStringMetadataOrThrow(GrpcNodeConnection.META_FILTER_PREFIX)

    const [watcher, completer] = agent.onContainerStateStreamStarted(prefix)
    if (!watcher) {
      this.logger.warn(`${agent.id} - There was no watcher for ${prefix}`)

      completer.next(undefined)
      return completer
    }

    return request.pipe(
      // necessary, because of: https://github.com/nestjs/nest/issues/8111
      startWith({
        prefix,
        data: [],
      }),
      map(it => {
        this.logger.verbose(`${agent.id} - Container status update - ${prefix}`)

        watcher.update(it)
        return Empty
      }),
      finalize(() => {
        agent.onContainerStatusStreamFinished(prefix)
        this.logger.debug(`${agent.id} - Container status listening finished: ${prefix}`)
      }),
      takeUntil(completer),
    )
  }

  async updateAgent(id: string): Promise<void> {
    const agent = this.getByIdOrThrow(id)
    const tag = this.getAgentImageTag()

    const token = generateAgentToken(id, 'connection')

    const signedToken = this.jwtService.sign(token)

    agent.startUpdate(tag, {
      token,
      signedToken,
      startedAt: new Date(),
    })

    await this.createAgentAudit(id, 'update', {
      fromVersion: agent.version,
      tag,
    })
  }

  updateAborted(connection: GrpcNodeConnection, request: AgentAbortUpdate): Empty {
    this.logger.warn(`Agent updated aborted for '${connection.nodeId}' with error: '${request.error}'`)

    const agent = this.getByIdOrThrow(connection.nodeId)

    agent.onUpdateAborted(request.error)

    return Empty
  }

  containersDeleted(connection: GrpcNodeConnection, request: DeleteContainersRequest): Empty {
    this.logger.log(`Containers deleted on '${connection.nodeId}'`)

    const agent = this.getByIdOrThrow(connection.nodeId)
    agent.onContainerDeleted(request)

    return Empty
  }

  handleContainerLog(connection: GrpcNodeConnection, request: Observable<ContainerLogMessage>): Observable<Empty> {
    const agent = this.getByIdOrThrow(connection.nodeId)

    const containerPrefix = connection.getStringMetadata(GrpcNodeConnection.META_CONTAINER_PREFIX)
    const containerName = connection.getStringMetadata(GrpcNodeConnection.META_CONTAINER_NAME)

    const container: ContainerIdentifier = {
      prefix: containerPrefix ?? '',
      name: containerName,
    }

    const key = Agent.containerPrefixNameOf(container)
    const [stream, completer] = agent.onContainerLogStreamStarted(container)
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
        agent.onContainerLogStreamFinished(container)
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

  async tokenReplaced(connection: GrpcNodeConnection): Promise<Empty> {
    const agent = this.getByIdOrThrow(connection.nodeId)

    const replacement = agent.onTokenReplaced()
    const { token } = replacement

    await this.prisma.nodeToken.upsert({
      where: {
        nodeId: agent.id,
      },
      create: {
        nodeId: agent.id,
        nonce: token.nonce,
      },
      update: {
        nonce: token.nonce,
      },
    })

    await this.createAgentAudit(agent.id, 'tokenReplaced')

    return Empty
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

      this.logger.log(`Agent joined with id: ${agent.id}, version: ${agent.version} key: ${!!agent.publicKey}`)
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
    const strategy = this.connectionStrategies.select(connection)
    const agent = await strategy.execute(connection, request)
    this.logger.verbose('Connection strategy completed')

    if (agent.id === AgentConnectionLegacyStrategy.LEGACY_NONCE) {
      // self destruct message is already in the queue
      // we just have to return the command channel

      // command channel is already completed so no need for onDisconnected() call
      this.logger.verbose('Crashing legacy agent intercepted.')
      return agent.onConnected(AgentConnectionLegacyStrategy.CONNECTION_STATUS_LISTENER)
    }

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

  private getAgentImageTag() {
    return this.configService.get<string>('AGENT_IMAGE') ?? getAgentVersionFromPackage(this.configService)
  }

  private logServiceInfo(): void {
    this.logger.verbose(`Agents: ${this.agents.size}`)
    this.agents.forEach(it => it.debugInfo(this.logger))
  }
}
