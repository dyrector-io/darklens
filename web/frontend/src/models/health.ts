import { DyoErrorDto } from './common'

export type ServiceStatus = 'unavailable' | 'disrupted' | 'operational'

export type ServiceInfo = {
  status: ServiceStatus
  version?: string
}
export const DEFAULT_SERVICE_INFO: ServiceInfo = {
  status: 'unavailable',
  version: null,
}

export type BackendHealth = ServiceInfo & {
  lastMigration?: string
}
export const DEFAULT_BACKEND_HEALTH: BackendHealth = {
  ...DEFAULT_SERVICE_INFO,
  lastMigration: null,
}

export type DyoServiceInfo = {
  app: ServiceInfo
  backend: ServiceInfo
  database: ServiceInfo
}

export type UnavailableErrorType = 'backend'

export type UnavailableErrorDto = DyoErrorDto & {
  error: UnavailableErrorType
}
