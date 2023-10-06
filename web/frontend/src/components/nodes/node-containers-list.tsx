import ContainerStatusTag from 'src/components/nodes/container-status-tag'
import { NodeDetailsActions, NodeDetailsState } from 'src/components/nodes/use-node-details-state'
import Paginator from 'src/components/shared/paginator'
import { DyoCard } from 'src/elements/dyo-card'
import DyoIcon from 'src/elements/dyo-icon'
import DyoImgButton from 'src/elements/dyo-img-button'
import { DyoList } from 'src/elements/dyo-list'
import LoadingIndicator from 'src/elements/loading-indicator'
import { dateSort, enumSort, sortHeaderBuilder, stringSort, useSorting } from 'src/hooks/use-sorting'
import {
  CONTAINER_STATE_VALUES,
  Container,
  containerIsHidden,
  containerIsRestartable,
  containerIsStartable,
  containerIsStopable,
  containerPortsToString,
  containerPrefixNameOf,
  imageName,
} from 'src/models'
import { nodeContainerInspectUrl, nodeContainerLogUrl } from 'src/routes'
import { utcDateToLocale } from 'src/utils'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import restart from 'src/assets/restart.svg'
import start from 'src/assets/start.svg'
import stop from 'src/assets/stop.svg'
import trashCan from 'src/assets/trash-can.svg'
import note from 'src/assets/note.svg'
import book from 'src/assets/book.svg'

interface NodeContainersListProps {
  state: NodeDetailsState
  actions: NodeDetailsActions
  showHidden?: boolean
}

type ContainerSorting = 'name' | 'imageTag' | 'state' | 'reason' | 'createdAt'

const NodeContainersList = (props: NodeContainersListProps) => {
  const { state, actions, showHidden } = props
  const { containerItems } = state

  const { t } = useTranslation('nodes')

  const sorting = useSorting<Container, ContainerSorting>(containerItems, {
    initialField: 'createdAt',
    initialDirection: 'asc',
    sortFunctions: {
      name: stringSort,
      imageTag: stringSort,
      state: enumSort(CONTAINER_STATE_VALUES),
      reason: stringSort,
      createdAt: dateSort,
    },
    fieldGetters: {
      name: it => containerPrefixNameOf(it.id),
      imageTag: it => imageName(it.imageName, it.imageTag),
    },
  })

  const listItems = showHidden ? sorting.items : sorting.items.filter(it => !containerIsHidden(it))

  const headers = [
    'common:name',
    'common:imageTag',
    'common:state',
    'common:reason',
    'common:createdAt',
    'ports',
    'common:actions',
  ]

  const itemBuilder = (container: Container) => {
    const name = containerPrefixNameOf(container.id)
    const targetState = state.containerTargetStates[name]
    const containerPortsText = containerPortsToString(container.ports)

    return [
      <span>{name}</span>,
      <span className="block overflow-hidden truncate">{imageName(container.imageName, container.imageTag)}</span>,
      <ContainerStatusTag className="inline-block" state={container.state} />,
      <span>{container.reason}</span>,
      <span>{utcDateToLocale(container.createdAt)}</span>,
      !container.ports ? null : (
        <span className="block overflow-hidden truncate" title={containerPortsText}>
          {containerPortsText}
        </span>
      ),
      <div className="flex gap-1 justify-end items-center">
        {targetState ? (
          <LoadingIndicator />
        ) : (
          <>
            {containerIsRestartable(container.state) ? (
              <DyoImgButton
                src={restart}
                alt={t('restart')}
                height={24}
                onClick={() => actions.onRestartContainer(container)}
              />
            ) : (
              <DyoImgButton
                disabled={!containerIsStartable(container.state)}
                src={start}
                alt={t('start')}
                height={24}
                onClick={() => actions.onStartContainer(container)}
              />
            )}

            <DyoImgButton
              disabled={!containerIsStopable(container.state)}
              src={stop}
              alt={t('stop')}
              height={24}
              onClick={() => actions.onStopContainer(container)}
            />

            {container.state && (
              <>
                <Link to={nodeContainerLogUrl(state.node.id, container.id)}>
                  <DyoIcon className="align-bottom" src={note} alt={t('logs')} size="md" />
                </Link>
                <Link to={nodeContainerInspectUrl(state.node.id, container.id)}>
                  <DyoIcon className="align-bottom" src={book} alt={t('inspect')} size="md" />
                </Link>
              </>
            )}

            <DyoImgButton
              src={trashCan}
              alt={t('common:delete')}
              height={24}
              onClick={() => actions.onDeleteContainer(container)}
            />
          </>
        )}
      </div>,
    ]
  }

  const columnWidths = ['w-2/12', 'w-3/12', 'w-1/12', 'w-1/12', '', '', 'w-48']
  const defaultHeaderClass = 'uppercase text-lens-text-0 text-sm font-semibold bg-lens-surface-4 px-2 py-3 h-11'
  const headerClasses = [
    clsx('rounded-tl-lg pl-6', defaultHeaderClass),
    ...Array.from({ length: headers.length - 2 }).map(() => defaultHeaderClass),
    clsx('rounded-tr-lg pr-6 text-center', defaultHeaderClass),
  ]
  const defaultItemClass = 'h-12 min-h-min text-lens-text-1 p-2'
  const itemClasses = [
    clsx('pl-6', defaultItemClass),
    ...Array.from({ length: headers.length - 2 }).map(() => defaultItemClass),
    clsx('pr-6 text-center', defaultItemClass),
  ]

  return (
    <DyoCard className="">
      <DyoList
        headers={headers}
        headerClassName={headerClasses}
        columnWidths={columnWidths}
        itemClassName={itemClasses}
        data={listItems}
        itemBuilder={itemBuilder}
        headerBuilder={sortHeaderBuilder<Container, ContainerSorting>(
          sorting,
          {
            'common:name': 'name',
            'common:imageTag': 'imageTag',
            'common:state': 'state',
            'common:reason': 'reason',
            'common:createdAt': 'createdAt',
          },
          text => t(text),
        )}
        footerClassName="py-1"
        footer={
          <Paginator
            onChanged={actions.setContainerPagination}
            length={listItems.length}
            defaultPagination={{
              pageNumber: 0,
              pageSize: 10,
            }}
          />
        }
      />
    </DyoCard>
  )
}

export default NodeContainersList
