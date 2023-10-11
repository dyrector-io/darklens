import { WebSocketGateway } from '@nestjs/websockets'
import { Observable, from, map, mergeAll } from 'rxjs'
import { WsAuthorize, WsMessage, WsSubscribe } from 'src/websockets/common'
import { UseGlobalWsFilters, UseGlobalWsGuards } from 'src/websockets/decorators/ws.gateway.decorators'
import { NodeEventMessage, WS_TYPE_NODE_EVENT } from './node.message'
import NodeService from './node.service'

@WebSocketGateway({
  namespace: 'nodes',
})
@UseGlobalWsFilters()
@UseGlobalWsGuards()
export default class NodeWebSocketGateway {
  constructor(private readonly service: NodeService) {}

  @WsAuthorize()
  async onAuthorize(): Promise<boolean> {
    return true
  }

  @WsSubscribe()
  onSubscribe(): Observable<WsMessage> {
    return from(this.service.subscribeToNodeEvents()).pipe(
      mergeAll(),
      map(it => {
        const msg: WsMessage<NodeEventMessage> = {
          type: WS_TYPE_NODE_EVENT,
          data: it,
        }
        return msg
      }),
    )
  }
}
