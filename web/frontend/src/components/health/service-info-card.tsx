import { DyoCard } from 'src/elements/dyo-card'
import { DyoHeading } from 'src/elements/dyo-heading'
import { ServiceInfo } from 'src/models'
import clsx from 'clsx'
import ServiceStatusIndicator from './service-status-indicator'
import ServiceStatusTag from './service-status-tag'
import { useTranslation } from 'react-i18next'

interface ServiceStatusCardProps {
  className?: string
  name: string
  info: ServiceInfo
}

const ServiceInfoCard = (props: ServiceStatusCardProps) => {
  const { info, name, className } = props

  const { t } = useTranslation('status')

  return (
    <DyoCard className={clsx(className, 'flex flex-col p-8 m-4')}>
      <div className="flex flex-row flex-grow">
        <DyoHeading element="h3" className="text-xl text-white">
          {name}
        </DyoHeading>

        <ServiceStatusIndicator className="ml-auto" status={info.status} />
      </div>

      <ServiceStatusTag className="mx-auto mt-12" status={info.status} />

      <span className="text-lens-bright mx-auto mt-4">{`${t('version')}: ${info.version ?? t('unknown')}`}</span>
    </DyoCard>
  )
}

export default ServiceInfoCard
