import DyoIndicator from '@app/elements/dyo-indicator'
import { ContainerState } from '@app/models'
import useTranslation from 'next-translate/useTranslation'

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
