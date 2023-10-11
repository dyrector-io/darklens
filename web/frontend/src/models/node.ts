import { PaginationQuery } from './common'
import { Container, ContainerCommand } from './container'

export const NODE_INSTALL_SCRIPT_TYPE_VALUES = ['shell', 'powershell'] as const
export type NodeInstallScriptType = (typeof NODE_INSTALL_SCRIPT_TYPE_VALUES)[number]

export const NODE_STATUS_VALUES = ['unreachable', 'connected', 'outdated', 'updating'] as const
export type NodeStatus = (typeof NODE_STATUS_VALUES)[number]

export const NODE_EVENT_TYPE_VALUES = [
  'installed',
  'connected',
  'left',
  'kicked',
  'update',
  'updateCompleted',
  'containerCommand',
  'tokenReplaced',
] as const
export type NodeEventType = (typeof NODE_EVENT_TYPE_VALUES)[number]

export type NodeConnection = {
  address?: string
  status: NodeStatus
  connectedAt?: string
  version?: string
}

export type DyoNode = NodeConnection & {
  id: string
  name: string
  description?: string
  icon?: string
}

export type NodeInstall = {
  command: string
  script: string
  expireAt: string
}

export type NodeDetails = DyoNode & {
  hasToken: boolean
  install?: NodeInstall
  lastConnectionAt?: string
  updatable: boolean
}

export const nodeConnectionOf = (node: DyoNode): NodeConnection =>
  node === null
    ? ({
        status: 'unreachable',
      } as NodeConnection)
    : {
        address: node.address,
        status: node.status,
        connectedAt: node.connectedAt,
        version: node.version,
      }

export type CreateNode = {
  name: string
  description?: string
  icon?: string
}

export type UpdateNode = CreateNode

export type NodeGenerateScript = {
  scriptType: NodeInstallScriptType
  hostAddress?: string
}

export type NodeDeleteContainer = {
  container: string
}

export type NodeAuditLogQuery = PaginationQuery & {
  filterEventType?: NodeEventType
}

export type NodeAuditLog = {
  createdAt: string
  event: string
  data?: object
}

export type NodeAuditLogList = {
  items: NodeAuditLog[]
  total: number
}

export type NodeContainerInspection = {
  inspection: string
}

// ws

export const WS_TYPE_NODE_EVENT = 'event'
export type NodeEventMessage = {
  id: string
  status: NodeStatus
  address?: string
  version?: string
  connectedAt?: string
  error?: string
}

export const WS_TYPE_WATCH_CONTAINERS_STATE = 'watch-containers-state'
export type WatchContainerStatusMessage = {}

export const WS_TYPE_CONTAINERS_STATE_LIST = 'containers-state-list'
export type ContainersStateListMessage = {
  containers: Container[]
}

export const WS_TYPE_WATCH_CONTAINER_LOG = 'watch-container-log'
export type WatchContainerLogMessage = {
  container: string
}

export const WS_TYPE_CONTAINER_LOG = 'container-log'
export type ContainerLogMessage = {
  log: string
}

export const WS_TYPE_DELETE_CONTAINER = 'delete-container'
export type DeleteContainerMessage = {
  container: string
}

export const WS_TYPE_CONTAINER_COMMAND = 'container-command'
export type ContainerCommandMessage = ContainerCommand
