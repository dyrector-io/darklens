import DyoBadge from 'src/elements/dyo-badge'
import { DyoCard, DyoCardProps } from 'src/elements/dyo-card'
import DyoExpandableText from 'src/elements/dyo-expandable-text'
import { DyoHeading } from 'src/elements/dyo-heading'
import { DyoLabel } from 'src/elements/dyo-label'
import { DyoNode } from 'src/models'
import clsx from 'clsx'
import NodeStatusIndicator from './node-status-indicator'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

interface DyoNodeCardProps extends Omit<DyoCardProps, 'children'> {
  node: DyoNode
  titleHref?: string
  hideConnectionInfo?: boolean
}

const DyoNodeCard = (props: DyoNodeCardProps) => {
  const { node, titleHref, className, hideConnectionInfo } = props

  const { t } = useTranslation('common')

  const title = (
    <div className="flex flex-row">
      {node.icon ? <DyoBadge large icon={node.icon} /> : null}

      <DyoHeading
        className={clsx('text-xl text-lens-bright font-semibold my-auto mr-auto', node.icon ? 'ml-4' : null)}
        element="h3"
      >
        {node.name}
      </DyoHeading>

      {!hideConnectionInfo ? <NodeStatusIndicator className="place-items-center" status={node.status} /> : null}
    </div>
  )

  return (
    <DyoCard className={clsx(className ?? 'p-6', 'flex flex-col')}>
      {titleHref ? <Link to={titleHref}>{title}</Link> : title}

      {!hideConnectionInfo && node.address && (
        <DyoLabel className="mr-auto mt-6">
          {t(`address`)}: {node.address}
        </DyoLabel>
      )}

      <DyoExpandableText
        text={node.description}
        lineClamp={node.address ? 4 : 6}
        className="text-md text-lens-light mt-2 max-h-44"
        buttonClassName="w-fit"
        modalTitle={node.name}
      />
    </DyoCard>
  )
}

export default DyoNodeCard
