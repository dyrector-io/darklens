import { Page } from 'src/components/layout'
import DyoNodeCard from 'src/components/nodes/dyo-node-card'
import EditNodeSection from 'src/components/nodes/edit-node-section'
import { BreadcrumbLink } from 'src/components/shared/breadcrumb'
import PageHeading from 'src/components/shared/page-heading'
import { EnumFilter, enumFilterFor, TextFilter, textFilterFor, useFilters } from 'src/hooks/use-filters'
import useWebSocket from 'src/hooks/use-websocket'
import { DyoNode, NODE_STATUS_VALUES, NodeEventMessage, NodeStatus, WS_TYPE_NODE_EVENT } from 'src/models'
import { API_NODES, nodeDetailsUrl, ROUTE_NODES, WS_NODES } from 'src/routes'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import LoadingIndicator from 'src/elements/loading-indicator'
import plusIcon from 'src/assets/plus.svg'
import DyoIcon from 'src/elements/dyo-icon'
import DyoButton from 'src/elements/dyo-button'
import { DyoSelect } from 'src/elements/dyo-select'
import { DyoInput } from 'src/elements/dyo-input'
import { DyoLabel } from 'src/elements/dyo-label'
import { useBackendGet } from 'src/hooks/use-backend'

type NodeFilter = TextFilter & EnumFilter<NodeStatus>

const NodesPage = () => {
  const { t } = useTranslation('nodes')

  const backendGet = useBackendGet()

  const [loading, setLoading] = useState<boolean>(true)
  const filters = useFilters<DyoNode, NodeFilter>({
    filters: [
      textFilterFor<DyoNode>(it => [it.address, it.name, it.description, it.status, it.icon]),
      enumFilterFor<DyoNode, NodeStatus>(it => [it.status]),
    ],
    initialData: [],
  })

  const [creating, setCreating] = useState(false)
  const submitRef = useRef<() => Promise<any>>()

  const socket = useWebSocket(WS_NODES, {
    onError: _ => {
      toast(t('errors:connectionLost'))
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      const res = await backendGet<DyoNode[]>(API_NODES)
      if (!res.ok) {
        return
      }
      filters.setItems(res.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  socket.on(WS_TYPE_NODE_EVENT, (message: NodeEventMessage) => {
    const index = filters.items.findIndex(it => it.id === message.id)
    if (index < 0) {
      return
    }

    const old = filters.items[index]
    const node = {
      ...old,
      ...message,
    }

    const newNodes = [...filters.items]
    newNodes[index] = node

    filters.setItems(newNodes)
  })

  const onNodeEdited = async (node: DyoNode) => {
    const newNodes = [...filters.items]
    const index = filters.items.findIndex(it => it.id === node.id)

    if (index < 0) {
      newNodes.push(node)
    } else {
      const old = filters.items[index]
      const newNode = {
        ...old,
        ...node,
      }
      newNodes[index] = newNode
    }

    filters.setItems(newNodes)
  }

  const pageLink: BreadcrumbLink = {
    name: t('common:nodes'),
    url: ROUTE_NODES,
  }

  return (
    <Page title={t('common:nodes')} className="flex-1 flex flex-col">
      <PageHeading pageLink={pageLink}>
        {creating ? (
          <>
            <DyoButton className="ml-auto px-4" secondary onClick={() => setCreating(false)}>
              {t('common:discard')}
            </DyoButton>

            <DyoButton className="px-4 ml-4" onClick={() => submitRef.current()}>
              {t('common:save')}
            </DyoButton>
          </>
        ) : (
          <>
            <DyoSelect
              className="mr-4"
              value={filters.filter?.enum}
              onChange={it =>
                filters.setFilter({
                  enum: it.target.value as NodeStatus,
                })
              }
            >
              {['all', ...NODE_STATUS_VALUES].map(it => (
                <option key={it} value={it}>
                  {it === 'all' ? t('common:all') : t(`common:nodeStatuses.${it}`)}
                </option>
              ))}
            </DyoSelect>

            <DyoInput
              className={t('grow')}
              placeholder={t('common:search')}
              onChange={e => filters.setFilter({ text: e.target.value })}
            />
          </>
        )}
      </PageHeading>

      {creating ? (
        <EditNodeSection submitRef={submitRef} onNodeEdited={onNodeEdited} />
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingIndicator size="xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mt-2">
          {filters.filtered.map((it, index) => (
            <DyoNodeCard className="p-6 h-40" key={`node-${index}`} node={it} titleHref={nodeDetailsUrl(it.id)} />
          ))}
          <div
            className="h-40 rounded-lg ring-2 ring-lens-light-grey flex flex-col items-center justify-center cursor-pointer"
            onClick={() => setCreating(true)}
          >
            <DyoIcon src={plusIcon} size="xxl" alt="" />
            <DyoLabel>{t('add')}</DyoLabel>
          </div>
        </div>
      )}
    </Page>
  )
}

export default NodesPage
