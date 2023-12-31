import Paginator, { PaginationSettings } from 'src/components/shared/paginator'
import { DyoCard } from 'src/elements/dyo-card'
import DyoIcon from 'src/elements/dyo-icon'
import { DyoList } from 'src/elements/dyo-list'
import DyoModal from 'src/elements/dyo-modal'
import { useThrottling } from 'src/hooks/use-throttleing'
import {
  NODE_EVENT_TYPE_VALUES,
  NodeAuditLog,
  NodeAuditLogList,
  NodeAuditLogQuery,
  NodeDetails,
  NodeEventType,
} from 'src/models'
import { getEndOfToday, utcDateToLocale } from 'src/utils'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import JsonEditor from '../shared/json-editor'
import { dateSort, sortHeaderBuilder, stringSort, useSorting } from 'src/hooks/use-sorting'
import { nodeApiAuditUrl } from 'src/routes'
import { useTranslation } from 'react-i18next'
import eye from 'src/assets/eye.svg'
import { useBackendGet } from 'src/hooks/use-backend'
import { DyoLabel } from 'src/elements/dyo-label'
import { DyoSelect } from 'src/elements/dyo-select'
import DyoDatePicker from 'src/elements/dyo-date-picker'

interface NodeAuditListProps {
  node: NodeDetails
}

export type NodeAuditFilter = {
  from: Date
  to: Date
  eventType: NodeEventType
}

type NodeAuditLogSorting = 'createdAt' | 'event'

const defaultHeaderClass = 'uppercase text-lens-text-0 text-sm font-semibold bg-lens-surface-5 px-2 py-3 h-11'
const defaultItemClass = 'h-12 min-h-min text-lens-text-1 p-2'
const columnWidths = ['w-2/12', 'w-48', '', 'w-24']
const sixDays = 1000 * 60 * 60 * 24 * 6 // ms * minutes * hours * day * six
const defaultPagination: PaginationSettings = { pageNumber: 0, pageSize: 10 }

const NodeAuditList = (props: NodeAuditListProps) => {
  const { node } = props

  const { t } = useTranslation('nodes')
  const throttle = useThrottling(1000)

  const backendGet = useBackendGet()

  const endOfToday = getEndOfToday()

  const [total, setTotal] = useState(0)
  const [data, setData] = useState<NodeAuditLog[]>([])
  const [pagination, setPagination] = useState<PaginationSettings>(defaultPagination)
  const [showInfo, setShowInfo] = useState<NodeAuditLog>(null)

  const [auditFilter, setAuditFilter] = useState<NodeAuditFilter>({
    from: new Date(endOfToday.getTime() - sixDays),
    to: new Date(endOfToday),
    eventType: null,
  })

  const fetchData = async () => {
    const { from, to } = auditFilter

    const query: NodeAuditLogQuery = {
      skip: pagination.pageNumber * pagination.pageSize,
      take: pagination.pageSize,
      from: (from ?? new Date(endOfToday.getTime() - sixDays)).toISOString(),
      to: (to ?? endOfToday).toISOString(),
      filterEventType: auditFilter.eventType,
    }
    const res = await backendGet<NodeAuditLogList>(nodeApiAuditUrl(node.id, query))

    if (res.ok) {
      const list = res.data
      setData(list.items)
      setTotal(list.total)
    } else {
      setData([])
    }
  }

  const onAuditFilterChange = (filter: Partial<NodeAuditFilter>) => {
    setAuditFilter({
      ...auditFilter,
      ...filter,
    })
  }

  const onAuditDateChange = dates => {
    const [start, end] = dates
    if (end !== null) end.setHours(23, 59, 59, 999) // end of the day

    onAuditFilterChange({
      from: start,
      to: end,
    })
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
          src={eye}
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
      <div className="flex flex-row mb-4 mt-8 items-center">
        <DyoLabel className="text-lg flex-1">{t('logs')}</DyoLabel>

        <DyoSelect
          className="mr-4"
          value={auditFilter.eventType ?? 'none'}
          onChange={it =>
            onAuditFilterChange({
              eventType: it.target.value === 'none' ? null : (it.target.value as NodeEventType),
            })
          }
        >
          {['none', ...NODE_EVENT_TYPE_VALUES].map(it => (
            <option key={it} value={it}>
              {t(`auditEvents.${it}`)}
            </option>
          ))}
        </DyoSelect>

        <DyoDatePicker
          selectsRange
          startDate={auditFilter.from}
          endDate={auditFilter.to}
          onChange={onAuditDateChange}
          shouldCloseOnSelect={false}
          maxDate={new Date()}
          className="w-1/4"
        />
      </div>

      <DyoCard className="relative overflow-auto">
        <DyoList
          noSeparator
          headerClassName={headerClasses}
          itemClassName={itemClasses}
          columnWidths={columnWidths}
          data={sorting.items}
          headers={listHeaders}
          footerClassName="py-1"
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
          titleClassName="pl-4 font-lens-medium text-xl text-lens-text-0 mb-3"
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
