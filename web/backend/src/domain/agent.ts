import { Logger } from '@nestjs/common'
import { Node } from '@prisma/client'
import { catchError, finalize, Observable, of, Subject, Subscription, throwError, timeout, TimeoutError } from 'rxjs'
import { NodeConnectionStatus } from 'src/app/node/node.dto'
import { CruxInternalServerErrorException, CruxPreconditionFailedException } from 'src/exception/crux-exception'
import {
  AgentCommand,
  AgentInfo,
  CloseReason,
  ContainerCommandRequest,
  ContainerDeleteRequest,
  ContainerInspectMessage,
  Empty,
} from 'src/grpc/protobuf/proto/agent'
import { CONTAINER_DELETE_TIMEOUT, DEFAULT_CONTAINER_LOG_TAIL } from 'src/shared/const'
import GrpcNodeConnection from 'src/shared/grpc-node-connection'
import { AgentToken } from './agent-token'
import ContainerLogStream, { ContainerLogStreamCompleter } from './container-log-stream'
import ContainerStatusWatcher, { ContainerStatusStreamCompleter } from './container-status-watcher'
import { BufferedSubject } from './utils'

export type AgentOptions = {
  eventChannel: Subject<AgentConnectionMessage>
  connection: GrpcNodeConnection
  info: AgentInfo
  outdated: boolean
}

export type CreateAgentOptions = Omit<AgentOptions, 'eventChannel'> & {
  node: Node
}

export type AgentTokenReplacement = {
  token: AgentToken
  signedToken: string
}

export class Agent {
  public static INSPECT_TIMEOUT = 5000

  private readonly commandChannel = new BufferedSubject<AgentCommand>()

  private statusWatcher: ContainerStatusWatcher = null

  private inspectionWatchers: Map<string, Subject<ContainerInspectMessage>> = new Map()

  private deleteContainersRequests: Map<string, Subject<Empty>> = new Map()

  private logStreams: Map<string, ContainerLogStream> = new Map()

  private statusSubscriber: Subscription

  private readonly eventChannel: Subject<AgentConnectionMessage>

  private readonly connection: GrpcNodeConnection

  readonly info: AgentInfo

  readonly outdated: boolean

  private get connected() {
    return !this.commandChannel.closed
  }

  get id(): string {
    return this.connection.nodeId
  }

  get address(): string {
    return this.connection.address
  }

  get version(): string {
    return this.info.version
  }

  get ready(): boolean {
    return this.getConnectionStatus() === 'connected'
  }

  constructor(options: AgentOptions) {
    this.connection = options.connection
    this.info = options.info
    this.eventChannel = options.eventChannel
    this.outdated = options.outdated
  }

  getConnectionStatus(): NodeConnectionStatus {
    if (!this.connected) {
      return 'unreachable'
    }

    if (this.outdated) {
      return 'outdated'
    }

    return 'connected'
  }

  close(reason?: CloseReason) {
    if (reason) {
      this.commandChannel.next({
        close: {
          reason,
        },
      })
    }

    this.commandChannel.complete()
  }

  upsertContainerStatusWatcher(oneShot: boolean): ContainerStatusWatcher {
    this.throwIfCommandsAreDisabled()

    if (!this.statusWatcher) {
      this.statusWatcher = new ContainerStatusWatcher(oneShot)
      this.statusWatcher.start(this.commandChannel)
    }

    return this.statusWatcher
  }

  upsertContainerLogStream(key: string): ContainerLogStream {
    this.throwIfCommandsAreDisabled()

    let stream = this.logStreams.get(key)
    if (!stream) {
      stream = new ContainerLogStream(key, DEFAULT_CONTAINER_LOG_TAIL)
      this.logStreams.set(key, stream)
      stream.start(this.commandChannel)
    }

    return stream
  }

  sendContainerCommand(command: ContainerCommandRequest) {
    this.throwIfCommandsAreDisabled()

    this.commandChannel.next({
      containerCommand: command,
    } as AgentCommand)
  }

  deleteContainers(request: ContainerDeleteRequest): Observable<Empty> {
    this.throwIfCommandsAreDisabled()

    const key = request.name

    const result = new Subject<Empty>()
    this.deleteContainersRequests.set(key, result)

    this.commandChannel.next({
      containerDelete: request,
    } as AgentCommand)

    return result.pipe(
      timeout(CONTAINER_DELETE_TIMEOUT),
      catchError(err => {
        if (err instanceof TimeoutError) {
          result.complete()
          this.deleteContainersRequests.delete(key)
          return of(Empty)
        }

        throw err
      }),
    )
  }

  onConnected(statusListener: (status: NodeConnectionStatus) => void): Observable<AgentCommand> {
    this.statusSubscriber = this.connection.status().subscribe(statusListener)

    this.eventChannel.next({
      id: this.id,
      address: this.address,
      status: this.getConnectionStatus(),
      version: this.version,
      connectedAt: this.connection.connectedAt,
    })

    return this.commandChannel.asObservable()
  }

  onDisconnected() {
    if (this.statusWatcher) {
      this.statusWatcher.stop()
    }
    this.logStreams.forEach(it => it.stop())
    this.commandChannel.complete()

    this.eventChannel.next({
      id: this.id,
      status: 'unreachable',
      address: null,
      version: null,
      connectedAt: null,
    })
  }

  onContainerStateStreamStarted(): [ContainerStatusWatcher, ContainerStatusStreamCompleter] {
    const watcher = this.statusWatcher
    if (!watcher) {
      return [null, null]
    }

    return [watcher, watcher.onNodeStreamStarted()]
  }

  onContainerStatusStreamFinished() {
    const watcher = this.statusWatcher
    if (!watcher) {
      return
    }

    this.statusWatcher = null
    watcher.onNodeStreamFinished()
  }

  onContainerLogStreamStarted(key: string): [ContainerLogStream, ContainerLogStreamCompleter] {
    const stream = this.logStreams.get(key)
    if (!stream) {
      return [null, null]
    }

    return [stream, stream.onNodeStreamStarted()]
  }

  onContainerLogStreamFinished(key: string) {
    const watcher = this.logStreams.get(key)
    if (!watcher) {
      return
    }

    this.logStreams.delete(key)
    watcher.onNodeStreamFinished()
  }

  getContainerInspection(key: string): Observable<ContainerInspectMessage> {
    this.throwIfCommandsAreDisabled()

    let watcher = this.inspectionWatchers.get(key)
    if (!watcher) {
      watcher = new Subject<ContainerInspectMessage>()
      this.inspectionWatchers.set(key, watcher)

      this.commandChannel.next({
        containerInspect: {
          name: key,
        },
      } as AgentCommand)
    }

    return watcher.pipe(
      finalize(() => {
        this.inspectionWatchers.delete(key)
      }),
      timeout({
        each: Agent.INSPECT_TIMEOUT,
        with: () => {
          this.inspectionWatchers.delete(key)

          return throwError(
            () =>
              new CruxInternalServerErrorException({
                message: 'Agent container inspection timed out.',
              }),
          )
        },
      }),
    )
  }

  onContainerInspect(res: ContainerInspectMessage) {
    const key = res.name

    const watcher = this.inspectionWatchers.get(key)
    if (!watcher) {
      return
    }

    watcher.next(res)
    watcher.complete()

    this.inspectionWatchers.delete(key)
  }

  onContainerDeleted(request: ContainerDeleteRequest) {
    const key = request.name

    const result = this.deleteContainersRequests.get(key)
    if (result) {
      this.deleteContainersRequests.delete(key)
      result.complete()
    }
  }

  debugInfo(logger: Logger) {
    logger.verbose(`Agent id: ${this.id}, open: ${!this.commandChannel.closed}`)
    logger.verbose(`Wathcing: ${this.statusWatcher ? 'yes' : 'no'}`)
    logger.verbose(`Log streams: ${this.logStreams.size}`)
  }

  private throwIfCommandsAreDisabled() {
    if (this.outdated) {
      throw new CruxPreconditionFailedException({
        message: 'Node is outdated',
        property: 'id',
        value: this.id,
      })
    }
  }
}

export type AgentConnectionMessage = {
  id: string
  status: NodeConnectionStatus
  address?: string
  version?: string
  connectedAt?: Date
  error?: string
}
