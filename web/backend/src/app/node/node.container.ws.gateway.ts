import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { Observable, map } from 'rxjs'
import { AuditLogLevel } from 'src/decorators/audit-logger.decorator'
import { WsAuthorize, WsMessage } from 'src/websockets/common'
import {
  UseGlobalWsFilters,
  UseGlobalWsGuards,
  UseGlobalWsInterceptors,
} from 'src/websockets/decorators/ws.gateway.decorators'
import WsParam from 'src/websockets/decorators/ws.param.decorator'
import SocketMessage from 'src/websockets/decorators/ws.socket-message.decorator'
import {
  ContainerCommandMessage,
  ContainerLogMessage,
  ContainersStateListMessage,
  DeleteContainerMessage,
  WS_TYPE_CONTAINERS_STATE_LIST,
  WS_TYPE_CONTAINER_LOG,
  WatchContainerLogMessage,
} from './node.message'
import NodeService from './node.service'

const NodeId = () => WsParam('nodeId')

@WebSocketGateway({
  namespace: 'nodes/:nodeId',
})
@UseGlobalWsFilters()
@UseGlobalWsGuards()
@UseGlobalWsInterceptors()
export default class NodeContainerWebSocketGateway {
  constructor(private readonly service: NodeService) {}

  @WsAuthorize()
  async onAuthorize(@NodeId() nodeId: string): Promise<boolean> {
    return this.service.checkNode(nodeId)
  }

  @SubscribeMessage('container-command')
  async containerCommand(@NodeId() nodeId: string, @SocketMessage() message: ContainerCommandMessage): Promise<void> {
    const { container, operation } = message
    if (operation === 'start') {
      await this.service.startContainer(nodeId, container)
    } else if (operation === 'stop') {
      await this.service.stopContainer(nodeId, container)
    } else if (operation === 'restart') {
      await this.service.restartContainer(nodeId, container)
    }
  }

  @AuditLogLevel('disabled')
  @SubscribeMessage('watch-containers-state')
  watchContainersState(@NodeId() nodeId: string): Observable<WsMessage<ContainersStateListMessage>> {
    return this.service.watchContainersState(nodeId).pipe(
      map(it => {
        const msg: WsMessage<ContainersStateListMessage> = {
          type: WS_TYPE_CONTAINERS_STATE_LIST,
          data: it,
        }

        return msg
      }),
    )
  }

  @AuditLogLevel('disabled')
  @SubscribeMessage('watch-container-log')
  watchContainerLog(
    @NodeId() nodeId: string,
    @SocketMessage() message: WatchContainerLogMessage,
  ): Observable<WsMessage<ContainerLogMessage>> {
    return this.service.watchContainerLog(nodeId, message).pipe(
      map(it => {
        const msg: WsMessage<ContainerLogMessage> = {
          type: WS_TYPE_CONTAINER_LOG,
          data: it,
        }

        return msg
      }),
    )
  }

  @SubscribeMessage('delete-container')
  async deleteContainer(@NodeId() nodeId: string, @SocketMessage() message: DeleteContainerMessage): Promise<void> {
    const { container } = message

    await this.service.deleteContainer(nodeId, container)
  }
}
