import DyoTag from 'src/elements/dyo-tag'
import { ContainerState } from 'src/models'
import { useTranslation } from 'react-i18next'

interface ContainerStatusTagProps {
  className?: string
  state: ContainerState
}

const ContainerStatusTag = (props: ContainerStatusTagProps) => {
  const { state, className } = props

  const { t } = useTranslation('common')

  const statusToBgColor = () => {
    switch (state) {
      case 'running':
        return 'bg-lens-green'
      case 'exited':
      case 'dead':
      case 'restarting':
        return 'bg-lens-error-red'
      case 'removing':
        return 'bg-lens-purple'
      default:
        return 'bg-lens-warning-orange'
    }
  }

  const statusToTextColor = () => {
    switch (state) {
      case 'running':
        return 'text-lens-green'
      case 'exited':
      case 'dead':
      case 'restarting':
        return 'text-lens-error-red'
      case 'removing':
        return 'text-lens-purple-light'
      default:
        return 'text-lens-warning-orange'
    }
  }

  return (
    <DyoTag
      color={state ? statusToBgColor() : 'bg-lens-bright'}
      textColor={state ? statusToTextColor() : 'text-lens-bright'}
      className={className}
      solid={state === 'removing'}
    >
      {state ? t(`containerStatuses.${state}`) : t('errors:notFound')}
    </DyoTag>
  )
}

export default ContainerStatusTag
