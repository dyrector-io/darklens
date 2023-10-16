import { generateNonce } from './utils'

export type AgentLegacyToken = {
  sub: string
  iss: string
  iat: number
}

export type AgentToken = {
  sub: string
  iss: string
  iat: number
  nonce: string
  host?: string
}

export const generateAgentToken = (nodeId: string, host?: string): AgentToken => {
  const now = new Date().getTime()

  const nonce = generateNonce()

  const token: AgentToken = {
    iat: Math.floor(now / 1000),
    iss: undefined, // this gets filled by JwtService by the sign() call
    sub: nodeId,
    nonce,
    host: host ?? undefined,
  }

  return token
}
