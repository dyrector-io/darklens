import DyoIndicator from 'src/elements/dyo-indicator'
import { ServiceStatus } from 'src/models'
import { useTranslation } from 'react-i18next'

const statusToColor = (status: ServiceStatus) => {
  switch (status) {
    case 'operational':
      return 'bg-lens-green'
    case 'disrupted':
      return 'bg-lens-warning-orange'
    case 'unavailable':
      return 'bg-lens-red'
    default:
      return 'bg-lens-red'
  }
}

interface ServiceStatusIndicatorProps {
  className?: string
  status: ServiceStatus
}

const ServiceStatusIndicator = (props: ServiceStatusIndicatorProps) => {
  const { status, className } = props

  const { t } = useTranslation('status')

  return <DyoIndicator className={className} color={statusToColor(status)} title={t(`status.${status}`)} />
}

export default ServiceStatusIndicator
