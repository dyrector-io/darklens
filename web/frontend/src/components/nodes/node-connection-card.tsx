import DyoBadge from 'src/elements/dyo-badge'
import { DyoCard } from 'src/elements/dyo-card'
import { DyoHeading } from 'src/elements/dyo-heading'
import { DyoLabel } from 'src/elements/dyo-label'
import TimeLabel from 'src/elements/time-label'
import { DyoNode } from 'src/models'
import clsx from 'clsx'
import NodeStatusIndicator from './node-status-indicator'
import useNodeUptime from './use-node-uptime'
import { useTranslation } from 'react-i18next'

interface NodeConnectionCardProps {
  className?: string
  node: DyoNode
  showName?: boolean
}

const NodeConnectionCard = (props: NodeConnectionCardProps) => {
  const { node, className, showName } = props

  const { t } = useTranslation('nodes')

  const runningSince = useNodeUptime(node)

  return (
    <DyoCard className={clsx(className ?? 'p-6')}>
      {!showName ? null : (
        <div className="flex flex-row items-center gap-1 mb-2">
          {node.icon ? (
            <DyoBadge icon={node.icon} />
          ) : (
            <span className="text-lens-text-0 text-xl">{`${t('common:node')}:`}</span>
          )}

          <DyoHeading
            className={clsx(
              'text-xl text-lens-text-0 font-semibold truncate my-auto mr-auto',
              node.icon ? 'ml-4' : null,
            )}
            element="h3"
          >
            {node.name}
          </DyoHeading>
        </div>
      )}

      <div className="grid grid-cols-2 justify-between items-center">
        <DyoLabel>{t('address')}</DyoLabel>
        <span className="text-lens-text-1">{node.address}</span>

        <DyoLabel className="self-start"> {t('version')}</DyoLabel>
        <span className="text-lens-text-1">{node.version}</span>

        <DyoLabel>{t('status')}</DyoLabel>
        <div className="flex flex-row">
          <NodeStatusIndicator className="my-auto mr-2" status={node.status} />

          <span className="text-lens-text-1">{t(`common:nodeStatuses.${node.status}`)}</span>
        </div>

        <DyoLabel>{t('uptime')}</DyoLabel>
        {runningSince ? <TimeLabel textColor="text-lens-turquoise" seconds={runningSince} /> : null}

        {node.status === 'updating' && (
          <>
            <DyoLabel>{t('update')}</DyoLabel>
            <span className="text-lens-text-1">{t('in-progress')}</span>
          </>
        )}
      </div>
    </DyoCard>
  )
}

export default NodeConnectionCard
