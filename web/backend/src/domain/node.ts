import { Node, NodeToken } from 'prisma/prisma-client'

export type BasicNode = Pick<Node, 'id' | 'name'>

export type NodeScriptType = 'shell' | 'powershell'

export type NodeWithToken = Node & {
  token?: NodeToken
}
