import { Node } from 'prisma/prisma-client'

export type BasicNode = Pick<Node, 'id' | 'name'>

export type NodeScriptType = 'shell' | 'powershell'
