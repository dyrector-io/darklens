import Paginator, { PaginationSettings } from '@app/components/shared/paginator'
import { DyoCard } from '@app/elements/dyo-card'
import DyoIcon from '@app/elements/dyo-icon'
import { DyoList } from '@app/elements/dyo-list'
import DyoModal from '@app/elements/dyo-modal'
import { useThrottling } from '@app/hooks/use-throttleing'
import { NodeAuditLog, NodeAuditLogList, NodeAuditLogQuery } from '@app/models'
import { getEndOfToday, utcDateToLocale } from '@app/utils'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'
import JsonEditor from '../shared/json-editor'
import { dateSort, sortHeaderBuilder, stringSort, useSorting } from '@app/hooks/use-sorting'
import { nodeApiAuditUrl } from '@app/routes'
import { NodeDetailsState } from './use-node-details-state'

interface NodeAuditListProps {
  state: NodeDetailsState
}

type NodeAuditLogSorting = 'createdAt' | 'event'

const defaultHeaderClass = 'uppercase text-lens-bright text-sm font-semibold bg-lens-medium-eased px-2 py-3 h-11'
const defaultItemClass = 'h-12 min-h-min text-lens-light-eased p-2'
const columnWidths = ['w-2/12', 'w-48', '', 'w-24']
const sixDays = 1000 * 60 * 60 * 24 * 6 // ms * minutes * hours * day * six
const defaultPagination: PaginationSettings = { pageNumber: 0, pageSize: 10 }

const NodeAuditList = (props: NodeAuditListProps) => {
  const { state } = props
  const { node, auditFilter } = state

  const { t } = useTranslation('nodes')
  const throttle = useThrottling(1000)

  const endOfToday = getEndOfToday()

  const [total, setTotal] = useState(0)
  const [data, setData] = useState<NodeAuditLog[]>([])
  const [pagination, setPagination] = useState<PaginationSettings>(defaultPagination)
  const [showInfo, setShowInfo] = useState<NodeAuditLog>(null)

  const fetchData = async () => {
    const { from, to } = auditFilter

    const query: NodeAuditLogQuery = {
      skip: pagination.pageNumber * pagination.pageSize,
      take: pagination.pageSize,
      from: (from ?? new Date(endOfToday.getTime() - sixDays)).toISOString(),
      to: (to ?? endOfToday).toISOString(),
      filterEventType: auditFilter.eventType,
    }
    const res = await fetch(nodeApiAuditUrl(node.id, query))

    if (res.ok) {
      const list = (await res.json()) as NodeAuditLogList
      setData(list.items)
      setTotal(list.total)
    } else {
      setData([])
    }
  }

  const sorting = useSorting<NodeAuditLog, NodeAuditLogSorting>(data, {
    initialField: 'createdAt',
    initialDirection: 'asc',
    initialDataSorted: true,
    sortFunctions: {
      createdAt: dateSort,
      event: stringSort,
    },
  })

  useEffect(() => {
    throttle(fetchData, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, auditFilter])

  const onShowInfoClick = (logEntry: NodeAuditLog) => setShowInfo(logEntry)

  const listHeaders = ['common:date', 'common:event', 'common:data', 'common:actions']
  const headerClasses = [
    clsx('rounded-tl-lg pl-6', defaultHeaderClass),
    ...Array.from({ length: listHeaders.length - 2 }).map(() => defaultHeaderClass),
    clsx('rounded-tr-lg pr-6 text-center', defaultHeaderClass),
  ]

  const itemClasses = [
    clsx('pl-6', defaultItemClass),
    ...Array.from({ length: listHeaders.length - 2 }).map(() => defaultItemClass),
    clsx('pr-6 text-center', defaultItemClass),
  ]

  const itemTemplate = (log: NodeAuditLog) => /* eslint-disable react/jsx-key */ [
    <div className="min-w-max">{utcDateToLocale(log.createdAt)}</div>,
    t(`auditEvents.${log.event}`),
    <div className="cursor-pointer max-w-4xl truncate" onClick={() => onShowInfoClick(log)}>
      {log.data && JSON.stringify(log.data)}
    </div>,
    <div className="text-center">
      {log.data && (
        <DyoIcon
          className="aspect-square cursor-pointer ml-auto mr-auto"
          src="/eye.svg"
          alt={t('common:view')}
          size="md"
          onClick={() => onShowInfoClick(log)}
        />
      )}
    </div>,
  ]
  /* eslint-enable react/jsx-key */

  return (
    <>
      <DyoCard className="relative overflow-auto">
        <DyoList
          noSeparator
          headerClassName={headerClasses}
          itemClassName={itemClasses}
          columnWidths={columnWidths}
          data={sorting.items}
          headers={listHeaders}
          footer={<Paginator onChanged={setPagination} length={total} defaultPagination={defaultPagination} />}
          itemBuilder={itemTemplate}
          headerBuilder={sortHeaderBuilder<NodeAuditLog, NodeAuditLogSorting>(
            sorting,
            {
              'common:date': 'createdAt',
              'common:event': 'event',
            },
            text => t(text),
          )}
        />
      </DyoCard>
      {!showInfo ? null : (
        <DyoModal
          className="w-1/2 h-1/2"
          titleClassName="pl-4 font-lens-medium text-xl text-lens-bright mb-3"
          title={`${t(`auditEvents.${showInfo.event}`)} | ${utcDateToLocale(showInfo.createdAt)}`}
          open={!!showInfo}
          onClose={() => setShowInfo(null)}
        >
          <JsonEditor className="overflow-y-auto p-4 h-full" disabled value={showInfo.data} />
        </DyoModal>
      )}
    </>
  )
}

export default NodeAuditList