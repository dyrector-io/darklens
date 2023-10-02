import { SERVICE_STATUS_CHECK_INTERVAL } from '@app/const'
import { BackendHealth, DEFAULT_BACKEND_HEALTH, ServiceInfo } from '@app/models'
import { API_HEALTH } from '@app/routes'
import { getBackend } from './api'

class ServiceStatusChecker<T extends ServiceInfo> {
  private lastCheck = 0

  private lastInfo: T

  private checking = false

  constructor(
    defaultInfo: T,
    private runCheck: () => Promise<T>,
  ) {
    this.lastInfo = defaultInfo
  }

  async info(): Promise<T> {
    const now = new Date().getTime()

    if (now - this.lastCheck > SERVICE_STATUS_CHECK_INTERVAL && !this.checking) {
      this.checking = true
      this.lastCheck = now

      try {
        this.lastInfo = await this.runCheck()
      } catch {
        this.lastInfo.status = 'unavailable'
      }

      this.checking = false
    }

    return this.lastInfo
  }
}

export type DyoServiceStatusCheckers = {
  backend: ServiceStatusChecker<BackendHealth>
}

if (!global.serviceStatus) {
  const getBackendHealth = async (): Promise<BackendHealth> => await getBackend<BackendHealth>(null, API_HEALTH)

  global.serviceStatus = {
    backend: new ServiceStatusChecker(DEFAULT_BACKEND_HEALTH, getBackendHealth),
  }
}

// eslint-disable-next-line prefer-destructuring
const serviceStatus: DyoServiceStatusCheckers = global.serviceStatus
export default serviceStatus
