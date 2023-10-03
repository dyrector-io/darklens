import DyoIndicator from 'src/elements/dyo-indicator'
import { ContainerState } from 'src/models'
import { useTranslation } from 'react-i18next'

const statusToColor = (status: ContainerState) => {
  switch (status) {
    case 'exited':
    case 'running':
      return 'bg-lens-green'
    case 'dead':
    case 'restarting':
      return 'bg-lens-red'
    case 'removing':
      return 'bg-lens-error-red'
    default:
      return 'bg-lens-warning-orange'
  }
}

interface ContainerStatusIndicatorProps {
  className?: string
  state: ContainerState
}

const ContainerStatusIndicator = (props: ContainerStatusIndicatorProps) => {
  const { state, className } = props

  const { t } = useTranslation('common')

  return (
    <DyoIndicator
      className={className}
      color={statusToColor(state)}
      title={state ? t(`containerStatuses.${state}`) : t('errors:notFound')}
    />
  )
}

export default ContainerStatusIndicator
