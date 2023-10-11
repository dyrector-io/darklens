export type AgentLegacyToken = {
  sub: string
  iss: string
  iat: number
}

export type AgentToken = {
  sub: string
  iss: string
  iat: number
  host?: string
}

export const generateAgentToken = (nodeId: string, host?: string): AgentToken => {
  const now = new Date().getTime()

  const token: AgentToken = {
    iat: Math.floor(now / 1000),
    iss: undefined, // this gets filled by JwtService by the sign() call
    sub: nodeId,
    host: host ?? undefined,
  }

  return token
}
