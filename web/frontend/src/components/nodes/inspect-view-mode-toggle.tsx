import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import viewTable from 'src/assets/view_table.svg'
import viewCode from 'src/assets/view_json.svg'
import DyoIcon from 'src/elements/dyo-icon'

export type InspectViewMode = 'table' | 'json'

export interface InspectViewModeToggleProps {
  className?: string
  viewMode: InspectViewMode
  onViewModeChanged: (mode: InspectViewMode) => void
}

const InspectViewModeToggle = (props: InspectViewModeToggleProps) => {
  const { className, viewMode, onViewModeChanged } = props

  const { t } = useTranslation('nodes')

  return (
    <div
      className={clsx(
        className,
        'px-1 bg-lens-surface-6 text-white font-semibold rounded cursor-pointer h-10 flex flex-row',
      )}
    >
      <div
        className={clsx('px-2 py-1.5 my-1 mr-0.5', viewMode === 'table' && 'bg-lens-turquoise rounded')}
        onClick={() => onViewModeChanged('table')}
      >
        <DyoIcon src={viewTable} alt={t('viewMode.table')} />
      </div>
      <div
        className={clsx('px-2 py-1.5 my-1 mr-0.5', viewMode === 'json' && 'bg-lens-turquoise rounded')}
        onClick={() => onViewModeChanged('json')}
      >
        <DyoIcon src={viewCode} alt={t('viewMode.json')} />
      </div>
    </div>
  )
}

export default InspectViewModeToggle
