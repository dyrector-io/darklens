import { useTranslation } from 'react-i18next'
import DyoIcon, { DyoIconSize } from './dyo-icon'
import loading from 'src/assets/loading.svg'

interface LoadingIndicatorProps {
  className?: string
  size?: DyoIconSize
}

const LoadingIndicator = (props: LoadingIndicatorProps) => {
  const { className, size } = props

  const { t } = useTranslation('common')

  return <DyoIcon className={className} imageClassName="animate-spin" src={loading} alt={t('loading')} size={size ?? "md"} />
}

export default LoadingIndicator
