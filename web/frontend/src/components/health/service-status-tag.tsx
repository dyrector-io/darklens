import DyoTag from 'src/elements/dyo-tag'
import { ServiceStatus } from 'src/models'

interface ServiceStatusTagProps {
  className?: string
  status: ServiceStatus
}

const ServiceStatusTag = (props: ServiceStatusTagProps) => {
  const { status, className } = props

  const statusToBgColor = () => {
    switch (status) {
      case 'operational':
        return 'bg-lens-green'
      case 'disrupted':
        return 'bg-lens-warning-orange'
      case 'unavailable':
        return 'bg-lens-error-red'
      default:
        return 'bg-lens-error-red'
    }
  }

  const statusToTextColor = () => {
    switch (status) {
      case 'operational':
        return 'text-lens-green'
      case 'disrupted':
        return 'text-lens-warning-orange'
      case 'unavailable':
        return 'text-lens-error-red'
      default:
        return 'text-lens-error-red'
    }
  }

  return (
    <DyoTag color={statusToBgColor()} textColor={statusToTextColor()} className={className}>
      {status?.toUpperCase()}
    </DyoTag>
  )
}

export default ServiceStatusTag
