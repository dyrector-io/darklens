import useWebSocket from 'src/hooks/use-websocket'
import {
  DyoNode,
  NodeConnection,
  nodeConnectionOf,
  NodeDetails,
  NodeEventMessage,
  WS_TYPE_NODE_EVENT,
} from 'src/models'
import { WS_NODES } from 'src/routes'
import { WsMessage } from 'src/websockets/common'
import { useState } from 'react'

const filterWsNodeId = (nodeId: string) => (message: WsMessage<Pick<NodeEventMessage, 'id'>>) => {
  const { data } = message

  if (data?.id !== nodeId) {
    return null
  }

  return message
}

const useNodeState = <T extends DyoNode | NodeDetails>(
  initialState: T | null,
  nodeId?: string,
): [T, (node: T) => void] => {
  const [node, setNode] = useState<T>(initialState)
  const [connection, setConnection] = useState<NodeConnection>(() => nodeConnectionOf(initialState))

  const sock = useWebSocket(WS_NODES, {
    transformReceive: filterWsNodeId(node.id ?? nodeId),
  })

  sock.on(WS_TYPE_NODE_EVENT, setConnection)

  return [{ ...node, ...connection }, setNode]
}

export default useNodeState
