export const AGENT_KICK_REASON_VALUES = ['delete-node', 'revoke-token'] as const
export type AgentKickReason = (typeof AGENT_KICK_REASON_VALUES)[number]

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
export type NodeEventTypeEnum = (typeof NODE_EVENT_TYPE_VALUES)[number]
