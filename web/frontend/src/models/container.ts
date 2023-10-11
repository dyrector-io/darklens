export const CONTAINER_STATE_VALUES = [
  'created',
  'restarting',
  'running',
  'removing',
  'paused',
  'exited',
  'dead',
] as const
export type ContainerState = (typeof CONTAINER_STATE_VALUES)[number]

export type ContainerPort = {
  internal: number
  external: number
}

export type Container = {
  name: string
  imageName: string
  imageTag: string
  createdAt: string
  state: ContainerState
  reason: string // kubernetes reason (like crashloop backoff) or docker state
  ports: ContainerPort[]
  labels: Record<string, string>
}

export type ContainerOperation = 'start' | 'stop' | 'restart'

export type ContainerCommand = {
  container: string
  operation: ContainerOperation
}

export const portToString = (port: ContainerPort): string => {
  const { internal, external } = port

  if (internal && external) {
    return `${external}->${internal}`
  }

  if (internal) {
    return `None->${internal}`
  }

  if (external) {
    return `${external}->None`
  }

  return '?'
}

export const containerPortsToString = (ports: ContainerPort[], truncateAfter: number = 2): string => {
  ports = ports.sort((one, other) => one.internal - other.internal)

  const result: string[] = []

  truncateAfter = Math.min(ports.length, truncateAfter + 1)

  let start: ContainerPort = null
  let end: ContainerPort = null
  let next: string = null
  for (let index = 0; index < truncateAfter && result.length < truncateAfter; index++) {
    const port = ports[index]

    if (!start) {
      start = port
      end = port
      next = portToString(start)
    } else if (port.internal - 1 === end.internal) {
      end = port
      next = `${portToString(start)}-${portToString(end)}`
    } else {
      result.push(next)

      start = port
      end = port
      next = portToString(start)
    }
  }

  if (next && result.length < truncateAfter) {
    result.push(next)
  }

  return result.join(', ')
}

export const containerIsStartable = (state: ContainerState) => state !== 'running' && state !== 'removing'
export const containerIsStopable = (state: ContainerState) => state === 'running' || state === 'paused'
export const containerIsRestartable = (state: ContainerState) => state === 'running'

export const imageName = (name: string, tag?: string): string => {
  if (!tag) {
    return name
  }

  return `${name}:${tag}`
}
