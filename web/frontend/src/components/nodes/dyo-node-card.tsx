import DyoBadge from 'src/elements/dyo-badge'
import { DyoCard, DyoCardProps } from 'src/elements/dyo-card'
import DyoExpandableText from 'src/elements/dyo-expandable-text'
import { DyoHeading } from 'src/elements/dyo-heading'
import { DyoNode } from 'src/models'
import clsx from 'clsx'
import NodeStatusIndicator from './node-status-indicator'
import { Link } from 'react-router-dom'
import DyoIcon from 'src/elements/dyo-icon'
import editIcon from 'src/assets/pencil.svg'
import deleteIcon from 'src/assets/trash-can.svg'

interface DyoNodeCardProps extends Omit<DyoCardProps, 'children'> {
  node: DyoNode
  titleHref?: string
  onEdit: () => void
  onDelete: () => void
}

const DyoNodeCard = (props: DyoNodeCardProps) => {
  const { node, titleHref, className, onEdit, onDelete } = props

  const title = (
    <div className="flex flex-row">
      {node.icon ? <DyoBadge large icon={node.icon} /> : null}

      <DyoHeading
        className={clsx('text-xl text-lens-text-0 font-semibold my-auto mr-auto', node.icon ? 'ml-4' : null)}
        element="h3"
      >
        {node.name}
      </DyoHeading>

      <NodeStatusIndicator className="place-items-center" status={node.status} />
    </div>
  )

  return (
    <DyoCard className={clsx(className ?? 'p-6', 'flex flex-col relative parent-hover')}>
      {titleHref ? <Link to={titleHref}>{title}</Link> : title}

      <DyoExpandableText
        text={node.description}
        lineClamp={1}
        className="text-md text-lens-text-2 mt-2 max-h-44"
        buttonClassName="w-fit"
        modalTitle={node.name}
      />

      <div className="absolute right-0 bottom-0 pr-2">
        <DyoIcon
          src={editIcon}
          alt=""
          className="cursor-pointer mr-1 opacity-10 parent-hover-child"
          size="lg"
          onClick={onEdit}
        />
        <DyoIcon
          src={deleteIcon}
          alt=""
          className="cursor-pointer opacity-10 parent-hover-child"
          size="lg"
          onClick={onDelete}
        />
      </div>
    </DyoCard>
  )
}

export default DyoNodeCard
