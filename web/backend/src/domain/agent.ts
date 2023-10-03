import { Logger } from '@nestjs/common'
import { catchError, Observable, of, Subject, Subscription, timeout, TimeoutError } from 'rxjs'
import { NodeConnectionStatus } from 'src/app/node/node.dto'
import { CruxConflictException, CruxPreconditionFailedException } from 'src/exception/crux-exception'
import { AgentCommand, AgentInfo, CloseReason } from 'src/grpc/protobuf/proto/agent'
import {
  ContainerCommandRequest,
  ContainerIdentifier,
  DeleteContainersRequest,
  Empty,
} from 'src/grpc/protobuf/proto/common'
import { CONTAINER_DELETE_TIMEOUT, DEFAULT_CONTAINER_LOG_TAIL } from 'src/shared/const'
import GrpcNodeConnection from 'src/shared/grpc-node-connection'
import { AgentToken } from './agent-token'
import AgentUpdate, { AgentUpdateOptions } from './agent-update'
import ContainerLogStream, { ContainerLogStreamCompleter } from './container-log-stream'
import ContainerStatusWatcher, { ContainerStatusStreamCompleter } from './container-status-watcher'
import { BufferedSubject } from './utils'

export type AgentOptions = {
  eventChannel: Subject<AgentConnectionMessage>
  connection: GrpcNodeConnection
  info: AgentInfo
  outdated: boolean
}

export type AgentTokenReplacement = {
  token: AgentToken
  signedToken: string
}

export class Agent {
  public static SECRET_TIMEOUT = 5000

  private readonly commandChannel = new BufferedSubject<AgentCommand>()

  private statusWatchers: Map<string, ContainerStatusWatcher> = new Map()

  private deleteContainersRequests: Map<string, Subject<Empty>> = new Map()

  private logStreams: Map<string, ContainerLogStream> = new Map()

  private update: AgentUpdate | null = null

  private replacementToken: AgentTokenReplacement | null = null

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

  get publicKey(): string {
    return this.info.publicKey
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

    if (this.updating) {
      return 'updating'
    }

    if (this.outdated) {
      return 'outdated'
    }

    return 'connected'
  }

  get updating() {
    if (!this.update) {
      return false
    }
    if (!this.update.expired) {
      return true
    }

    this.update = null
    return false
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

  replaceToken(replacement: AgentTokenReplacement) {
    if (this.replacementToken) {
      throw new CruxConflictException({
        message: 'Token replacement is already in progress',
        property: 'token',
      })
    }

    this.replacementToken = replacement

    this.commandChannel.next({
      replaceToken: {
        token: replacement.signedToken,
      },
    })
  }

  upsertContainerStatusWatcher(prefix: string, oneShot: boolean): ContainerStatusWatcher {
    this.throwIfCommandsAreDisabled()

    let watcher = this.statusWatchers.get(prefix)
    if (!watcher) {
      watcher = new ContainerStatusWatcher(prefix, oneShot)
      this.statusWatchers.set(prefix, watcher)
      watcher.start(this.commandChannel)
    }

    return watcher
  }

  upsertContainerLogStream(container: ContainerIdentifier): ContainerLogStream {
    this.throwIfCommandsAreDisabled()

    const key = Agent.containerPrefixNameOf(container)
    let stream = this.logStreams.get(key)
    if (!stream) {
      stream = new ContainerLogStream(container, DEFAULT_CONTAINER_LOG_TAIL)
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

  deleteContainers(request: DeleteContainersRequest): Observable<Empty> {
    this.throwIfCommandsAreDisabled()

    const reqId = Agent.containerDeleteRequestToRequestId(request)
    const result = new Subject<Empty>()
    this.deleteContainersRequests.set(reqId, result)

    this.commandChannel.next({
      deleteContainers: request,
    } as AgentCommand)

    return result.pipe(
      timeout(CONTAINER_DELETE_TIMEOUT),
      catchError(err => {
        if (err instanceof TimeoutError) {
          result.complete()
          this.deleteContainersRequests.delete(reqId)
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
    this.statusWatchers.forEach(it => it.stop())
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

  onContainerStateStreamStarted(prefix: string): [ContainerStatusWatcher, ContainerStatusStreamCompleter] {
    const watcher = this.statusWatchers.get(prefix)
    if (!watcher) {
      return [null, null]
    }

    return [watcher, watcher.onNodeStreamStarted()]
  }

  onContainerStatusStreamFinished(prefix: string) {
    const watcher = this.statusWatchers.get(prefix)
    if (!watcher) {
      return
    }

    this.statusWatchers.delete(prefix)
    watcher.onNodeStreamFinished()
  }

  onContainerLogStreamStarted(id: ContainerIdentifier): [ContainerLogStream, ContainerLogStreamCompleter] {
    const key = Agent.containerPrefixNameOf(id)

    const stream = this.logStreams.get(key)
    if (!stream) {
      return [null, null]
    }

    return [stream, stream.onNodeStreamStarted()]
  }

  onContainerLogStreamFinished(id: ContainerIdentifier) {
    const key = Agent.containerPrefixNameOf(id)
    const watcher = this.logStreams.get(key)
    if (!watcher) {
      return
    }

    this.logStreams.delete(key)
    watcher.onNodeStreamFinished()
  }

  startUpdate(tag: string, options: AgentUpdateOptions) {
    if (this.updating) {
      throw new CruxPreconditionFailedException({
        message: 'Node is already updating',
        property: 'id',
        value: this.id,
      })
    }

    this.update = new AgentUpdate(options)
    this.replacementToken = options
    this.update.start(this.commandChannel, tag)
  }

  onUpdateAborted(error?: string) {
    this.update = null
    this.replacementToken = null

    this.eventChannel.next({
      id: this.id,
      status: this.getConnectionStatus(),
      error,
    })
  }

  onUpdateCompleted(connection: GrpcNodeConnection) {
    this.update.complete(connection)

    try {
      this.statusSubscriber.unsubscribe()

      this.close(CloseReason.SELF_DESTRUCT)
    } catch {
      /* empty */
    }

    this.update = null
    this.eventChannel.next({
      id: this.id,
      status: this.getConnectionStatus(),
    })
  }

  onContainerDeleted(request: DeleteContainersRequest) {
    const reqId = Agent.containerDeleteRequestToRequestId(request)
    const result = this.deleteContainersRequests.get(reqId)
    if (result) {
      this.deleteContainersRequests.delete(reqId)
      result.complete()
    }
  }

  /**
   * returns with the new token
   */
  onTokenReplaced(): AgentTokenReplacement {
    if (!this.replacementToken) {
      throw new CruxPreconditionFailedException({
        message: 'Replacement was not requested',
      })
    }

    const replacement = this.replacementToken
    const { token, signedToken } = replacement

    this.connection.onTokenReplaced(token, signedToken)

    this.replacementToken = null
    return replacement
  }

  debugInfo(logger: Logger) {
    logger.verbose(`Agent id: ${this.id}, open: ${!this.commandChannel.closed}`)
    logger.verbose(`Watchers: ${this.statusWatchers.size}`)
    logger.verbose(`Log streams: ${this.logStreams.size}`)
  }

  private throwIfCommandsAreDisabled() {
    if (this.updating) {
      throw new CruxPreconditionFailedException({
        message: 'Node is updating',
        property: 'id',
        value: this.id,
      })
    }

    if (this.replacementToken) {
      throw new CruxPreconditionFailedException({
        message: 'Node is replacing connection token',
        property: 'id',
        value: this.id,
      })
    }

    if (this.outdated) {
      throw new CruxPreconditionFailedException({
        message: 'Node is outdated',
        property: 'id',
        value: this.id,
      })
    }
  }

  private static containerDeleteRequestToRequestId(request: DeleteContainersRequest): string {
    if (request.container) {
      return Agent.containerPrefixNameOf(request.container)
    }

    return request.prefix
  }

  public static containerPrefixNameOf = (id: ContainerIdentifier): string =>
    !id.prefix ? id.name : `${id.prefix}-${id.name}`
}

export type AgentConnectionMessage = {
  id: string
  status: NodeConnectionStatus
  address?: string
  version?: string
  connectedAt?: Date
  error?: string
}