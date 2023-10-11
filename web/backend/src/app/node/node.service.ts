import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import {
  EmptyError,
  Observable,
  filter,
  firstValueFrom,
  lastValueFrom,
  map,
  mergeAll,
  mergeWith,
  of,
  timeout,
} from 'rxjs'
import { AgentConnectionMessage } from 'src/domain/agent'
import {
  ContainerCommandRequest,
  ContainerDeleteRequest,
  ContainerOperation,
  ContainerStateListMessage,
  containerOperationToJSON,
} from 'src/grpc/protobuf/proto/agent'
import PrismaService from 'src/services/prisma.service'
import AgentService from '../agent/agent.service'
import {
  ContainerDto,
  ContainerInspectionDto,
  CreateNodeDto,
  NodeAuditLogListDto,
  NodeAuditLogQueryDto,
  NodeDetailsDto,
  NodeDto,
  NodeGenerateScriptDto,
  NodeInstallDto,
  UpdateNodeDto,
} from './node.dto'
import NodeMapper from './node.mapper'
import { ContainerLogMessage, ContainersStateListMessage, WatchContainerLogMessage } from './node.message'

@Injectable()
export default class NodeService {
  private readonly logger = new Logger(NodeService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
    private readonly mapper: NodeMapper,
  ) {}

  async checkNode(nodeId: string): Promise<boolean> {
    const nodes = await this.prisma.node.count({
      where: {
        id: nodeId,
      },
    })

    return nodes > 0
  }

  async getNodes(): Promise<NodeDto[]> {
    const nodes = await this.prisma.node.findMany()

    return nodes.map(it => this.mapper.toDto(it))
  }

  async getNodeDetails(id: string): Promise<NodeDetailsDto> {
    const node = await this.prisma.node.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        token: true,
      },
    })

    return this.mapper.detailsToDto(node)
  }

  async createNode(req: CreateNodeDto): Promise<NodeDto> {
    const node = await this.prisma.node.create({
      data: {
        name: req.name,
        description: req.description,
        icon: req.icon ?? null,
      },
    })

    return this.mapper.toDto(node)
  }

  async deleteNode(id: string): Promise<void> {
    await this.prisma.node.delete({
      where: {
        id,
      },
    })

    await this.agentService.kick(id, 'delete-node')
  }

  async updateNode(id: string, req: UpdateNodeDto): Promise<void> {
    await this.prisma.node.update({
      where: {
        id,
      },
      data: {
        name: req.name,
        description: req.description,
        icon: req.icon ?? null,
      },
    })
  }

  async generateScript(id: string, req: NodeGenerateScriptDto): Promise<NodeInstallDto> {
    const node = await this.prisma.node.findFirstOrThrow({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
      },
    })

    const installer = await this.agentService.startInstallation(node, req.scriptType, req.hostAddress ?? null)

    return this.mapper.installerToDto(installer)
  }

  async getScript(id: string): Promise<string> {
    const installer = this.agentService.getInstallerByNodeId(id)

    return installer.getScript()
  }

  async discardScript(id: string): Promise<void> {
    await this.agentService.discardInstaller(id)
  }

  async revokeToken(id: string): Promise<void> {
    await this.prisma.node.update({
      where: {
        id,
      },
      data: {
        token: {
          delete: true,
        },
      },
    })

    await this.agentService.kick(id, 'revoke-token')
  }

  async subscribeToNodeEvents(): Promise<Observable<AgentConnectionMessage>> {
    const nodes = await this.prisma.node.findMany()

    const currentEvents = nodes.map(it => this.mapper.toConnectionMessage(it))

    const events = await this.agentService.getNodeEvents()
    return events.pipe(mergeWith(of(currentEvents).pipe(mergeAll())))
  }

  watchContainersState(nodeId: string): Observable<ContainersStateListMessage> {
    return this.upsertAndWatchStateWatcher(nodeId, false).pipe(
      map(it => this.mapper.containerStateMessageToContainerMessage(it)),
    )
  }

  watchContainerLog(nodeId: string, message: WatchContainerLogMessage): Observable<ContainerLogMessage> {
    const { container } = message

    this.logger.debug(`Opening container log stream for container: ${nodeId} - ${container}}`)

    const agent = this.agentService.getByIdOrThrow(nodeId)

    const stream = agent.upsertContainerLogStream(container)

    return stream.watch()
  }

  async startContainer(nodeId: string, name: string): Promise<void> {
    await this.sendContainerOperation(nodeId, name, ContainerOperation.START_CONTAINER)
  }

  async stopContainer(nodeId: string, name: string): Promise<void> {
    await this.sendContainerOperation(nodeId, name, ContainerOperation.STOP_CONTAINER)
  }

  async restartContainer(nodeId: string, name: string): Promise<void> {
    await this.sendContainerOperation(nodeId, name, ContainerOperation.RESTART_CONTAINER)
  }

  async deleteContainer(nodeId: string, name: string): Promise<Observable<void>> {
    const agent = this.agentService.getByIdOrThrow(nodeId)
    const cmd: ContainerDeleteRequest = {
      name,
    }

    await this.agentService.createAgentAudit(nodeId, 'containerCommand', {
      operation: 'deleteContainer',
      ...cmd,
    })

    return agent.deleteContainers(cmd).pipe(map(() => undefined))
  }

  async getContainers(nodeId: string): Promise<ContainerDto[]> {
    try {
      const states = this.upsertAndWatchStateWatcher(nodeId, true).pipe(
        map(list => list.data?.map(it => this.mapper.containerStateItemToDto(it))),
        filter(it => it && it.length > 0),
        timeout(5000),
      )

      const containers = await firstValueFrom(states)

      return containers ?? []
    } catch (err) {
      // TODO(@m8vago): check if we can remove this workaround after rxjs update
      if (err instanceof EmptyError) {
        return []
      }

      throw err
    }
  }

  private upsertAndWatchStateWatcher(nodeId: string, oneShot: boolean): Observable<ContainerStateListMessage> {
    this.logger.debug(`Opening container state stream for node: ${nodeId}`)

    const agent = this.agentService.getByIdOrThrow(nodeId)
    const watcher = agent.upsertContainerStatusWatcher(oneShot)

    return watcher.watch()
  }

  private async sendContainerOperation(
    nodeId: string,
    container: string,
    operation: ContainerOperation,
  ): Promise<void> {
    const agent = this.agentService.getByIdOrThrow(nodeId)

    const command: ContainerCommandRequest = {
      name: container,
      operation,
    }

    agent.sendContainerCommand(command)

    await this.agentService.createAgentAudit(nodeId, 'containerCommand', {
      ...command,
      operation: NodeService.snakeCaseToCamelCase(containerOperationToJSON(command.operation)),
    })
  }

  async getAuditLog(nodeId: string, query: NodeAuditLogQueryDto): Promise<NodeAuditLogListDto> {
    const { skip, take, from, to } = query

    const where: Prisma.NodeEventWhereInput = {
      nodeId,
      AND: {
        createdAt: {
          gte: from,
          lte: to,
        },
        ...(query.filterEventType
          ? {
              AND: {
                event: query.filterEventType,
              },
            }
          : null),
      },
    }

    const [auditLog, total] = await this.prisma.$transaction([
      this.prisma.nodeEvent.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
        select: {
          createdAt: true,
          event: true,
          data: true,
        },
      }),
      this.prisma.nodeEvent.count({ where }),
    ])

    return {
      items: auditLog.map(it => ({
        ...it,
        data: it.data ? JSON.parse(it.data) : null,
      })),
      total,
    }
  }

  async inspectContainer(nodeId: string, name: string): Promise<ContainerInspectionDto> {
    const agent = this.agentService.getByIdOrThrow(nodeId)
    const watcher = agent.getContainerInspection(name)
    const inspectionMessage = await lastValueFrom(watcher)

    return this.mapper.containerInspectionMessageToDto(inspectionMessage)
  }

  private static snakeCaseToCamelCase(snake: string): string {
    return snake.toLocaleLowerCase().replace(/([-_][a-z])/g, it => it.replace('_', '').toLocaleUpperCase())
  }
}
