import { finalize, Observable, startWith, Subject } from 'rxjs'
import { CruxPreconditionFailedException } from 'src/exception/crux-exception'
import {
  AgentCommand,
  ContainerState,
  ContainerStateItem,
  ContainerStateListMessage,
} from 'src/grpc/protobuf/proto/agent'

export type ContainerStatusStreamCompleter = Subject<unknown>

export default class ContainerStatusWatcher {
  private stream = new Subject<ContainerStateListMessage>()

  private started = false

  private completer: ContainerStatusStreamCompleter = null

  private state: Record<string, ContainerStateItem> = {}

  constructor(private oneShot: boolean) {}

  start(commandChannel: Subject<AgentCommand>) {
    if (this.started) {
      return
    }

    commandChannel.next({
      containerState: {
        oneShot: this.oneShot,
      },
    } as AgentCommand)
    this.started = true
  }

  update(status: ContainerStateListMessage) {
    if (status.data) {
      const removedIds = status.data.filter(it => it.state === ContainerState.REMOVED).map(it => it.name)
      const updated = status.data.filter(it => it.state !== ContainerState.REMOVED)

      const stateMap = Object.keys(this.state)
        .filter(it => !removedIds.includes(it))
        .reduce((map, it) => {
          map[it] = this.state[it]
          return map
        }, {})

      this.state = updated.reduce((map, it) => {
        map[it.name] = it
        return map
      }, stateMap)
    }

    this.stream.next(this.mapStateToMessage())
  }

  stop() {
    if (!this.started) {
      return
    }

    this.started = false
    this.stream.complete()
    this.completer?.next(undefined)
    this.completer = null
  }

  watch(): Observable<ContainerStateListMessage> {
    return this.stream.pipe(
      startWith(this.mapStateToMessage()),
      finalize(() => this.onWatcherDisconnected()),
    )
  }

  onNodeStreamStarted(): ContainerStatusStreamCompleter {
    if (this.completer) {
      throw new CruxPreconditionFailedException({
        message: 'There is already a container status stream running',
      })
    }

    this.completer = new Subject<unknown>()
    return this.completer
  }

  onNodeStreamFinished() {
    if (!this.started) {
      return
    }

    this.stream.complete()
    this.completer?.next(undefined)
    this.completer = null
  }

  private onWatcherDisconnected() {
    if (!this.stream.observed) {
      this.stop()
    }
  }

  private mapStateToMessage(): ContainerStateListMessage {
    return {
      data: Object.values(this.state),
    }
  }
}
