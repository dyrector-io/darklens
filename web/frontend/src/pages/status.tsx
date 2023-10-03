import ServiceInfoCard from 'src/components/health/service-info-card'
import { SingleFormLayout } from 'src/components/layout'
import DyoButton from 'src/elements/dyo-button'
import { DyoHeading } from 'src/elements/dyo-heading'
import LoadingIndicator from 'src/elements/loading-indicator'
import { BackendHealth, DEFAULT_SERVICE_INFO, DyoServiceInfo } from 'src/models'
import { API_HEALTH, ROUTE_INDEX } from 'src/routes'
import { fetcher } from 'src/utils'
import packageInfo from 'src/server/package'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'

const StatusPage = () => {
  const { t } = useTranslation('status')
  const nav = useNavigate()

  const { data: backend, error, isLoading } = useSWR<BackendHealth, any>(API_HEALTH, fetcher)

  const navigateToIndex = async () => await nav(ROUTE_INDEX)

  if (error) {
    console.error(error)
  }

  const status: DyoServiceInfo = {
    backend,
    database: {
      status: backend?.lastMigration ? 'operational' : 'unavailable',
      version: backend?.lastMigration ? backend.lastMigration.split('_', 1)[0] : null,
    },
    app: {
      status: backend?.status,
      version: packageInfo.version,
    },
  }

  const itemClassName = 'lg:w-96'

  return (
    <SingleFormLayout title={t('serviceStatus')}>
      <DyoHeading element="h2" className="self-center text-lg lg:text-2xl text-white font-extrabold mt-auto">
        {t('serviceStatus')}
      </DyoHeading>

      <div className="grid grid-cols-2 self-center mt-12">
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <>
            <ServiceInfoCard
              className={itemClassName}
              name={t('app')}
              info={(error || status?.app) ?? DEFAULT_SERVICE_INFO}
            />

            <ServiceInfoCard className={itemClassName} name={t('api')} info={status?.backend ?? DEFAULT_SERVICE_INFO} />

            <ServiceInfoCard
              className={itemClassName}
              name={t('database')}
              info={status?.database ?? DEFAULT_SERVICE_INFO}
            />
          </>
        )}
      </div>

      <div className="flex flex-row mb-auto mt-12">
        <DyoButton className="px-12" outlined onClick={navigateToIndex}>
          {t('common:back')}
        </DyoButton>
      </div>
    </SingleFormLayout>
  )
}

export default StatusPage
