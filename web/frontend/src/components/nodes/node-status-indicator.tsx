import DyoIndicator from 'src/elements/dyo-indicator'
import { NodeStatus } from 'src/models'
import { useTranslation } from 'react-i18next'

const statusToColor = (status: NodeStatus) => {
  switch (status) {
    case 'unreachable':
      return 'bg-lens-red'
    case 'connected':
      return 'bg-lens-green'
    case 'outdated':
      return 'bg-lens-violet'
    default:
      return 'bg-lens-warning-orange'
  }
}

interface NodeStatusStatusIndicatorProps {
  className?: string
  status: NodeStatus
}

const NodeStatusIndicator = (props: NodeStatusStatusIndicatorProps) => {
  const { status, className } = props

  const { t } = useTranslation('common')

  return <DyoIndicator className={className} color={statusToColor(status)} title={t(`nodeStatuses.${status}`)} />
}

export default NodeStatusIndicator
