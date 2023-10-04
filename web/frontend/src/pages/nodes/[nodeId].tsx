import { Page } from 'src/components/layout'
import DyoNodeCard from 'src/components/nodes/dyo-node-card'
import EditNodeSection from 'src/components/nodes/edit-node-section'
import NodeAuditList from 'src/components/nodes/node-audit-list'
import NodeConnectionCard from 'src/components/nodes/node-connection-card'
import NodeContainersList from 'src/components/nodes/node-containers-list'
import NodeSectionsHeading from 'src/components/nodes/node-sections-heading'
import useNodeDetailsState from 'src/components/nodes/use-node-details-state'
import { BreadcrumbLink } from 'src/components/shared/breadcrumb'
import PageHeading from 'src/components/shared/page-heading'
import { DetailsPageMenu } from 'src/components/shared/page-menu'
import DyoDatePicker from 'src/elements/dyo-date-picker'
import { DyoInput } from 'src/elements/dyo-input'
import { DyoConfirmationModal } from 'src/elements/dyo-modal'
import { DyoSelect } from 'src/elements/dyo-select'
import { defaultApiErrorHandler } from 'src/errors'
import { NODE_EVENT_TYPE_VALUES, NodeDetails, NodeEventType } from 'src/models'
import { ROUTE_NODES, nodeApiDetailsUrl, nodeDetailsUrl } from 'src/routes'
import { fetcher } from 'src/utils'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingIndicator from 'src/elements/loading-indicator'

type NodeDetailsPageParams = {
  nodeId: string
}

interface NodeDetailsPageProps {
  node: NodeDetails
}

const NodeDetailsPage = (props: NodeDetailsPageProps) => {
  const { node: propsNode } = props

  const { t } = useTranslation('nodes')
  const nav = useNavigate()

  const [state, actions] = useNodeDetailsState({
    node: propsNode,
  })
  const submitRef = useRef<() => Promise<any>>()

  const { node, auditFilter } = state

  const handleApiError = defaultApiErrorHandler(t)

  const onDelete = async () => {
    const res = await fetch(nodeApiDetailsUrl(node.id), {
      method: 'DELETE',
    })

    if (!res.ok) {
      handleApiError(res)
      return
    }

    await nav(ROUTE_NODES)
  }

  const onNodeEdited = async (edited: NodeDetails, shouldClose?: boolean) => {
    actions.onNodeEdited(edited, shouldClose)
    if (shouldClose) {
      await nav(ROUTE_NODES, { replace: true })
    }
  }

  const onAuditDateChange = dates => {
    const [start, end] = dates
    if (end !== null) end.setHours(23, 59, 59, 999) // end of the day

    actions.onAuditFilterChange({
      from: start,
      to: end,
    })
  }

  const pageLink: BreadcrumbLink = {
    name: t('common:nodes'),
    url: ROUTE_NODES,
  }

  const subLinks: BreadcrumbLink[] = [
    {
      name: node.name,
      url: `${nodeDetailsUrl(node.id)}`,
    },
  ]

  return (
    <Page title={t('nodesName', node)}>
      <PageHeading pageLink={pageLink} sublinks={subLinks}>
        <DetailsPageMenu
          onDelete={onDelete}
          editing={state.section === 'editing'}
          setEditing={actions.setEditing}
          submitRef={submitRef}
          deleteModalTitle={t('common:areYouSureDeleteName', { name: node.name })}
          deleteModalDescription={t('common:proceedYouLoseAllDataToName', {
            name: node.name,
          })}
        />
      </PageHeading>

      {state.section === 'editing' ? (
        <EditNodeSection node={node} onNodeEdited={onNodeEdited} submitRef={submitRef} />
      ) : (
        <>
          <div className="flex flex-row gap-4">
            <DyoNodeCard className="w-2/3 p-6" node={node} hideConnectionInfo />

            <NodeConnectionCard className="w-1/3 px-6 py-4" node={node} />
          </div>

          <NodeSectionsHeading section={state.section} setSection={actions.setSection}>
            <div className="flex-1 flex flex-row justify-end">
              {state.section === 'containers' ? (
                <DyoInput
                  className={t('grow')}
                  placeholder={t('common:search')}
                  onChange={e => state.containerFilters.setFilter({ text: e.target.value })}
                />
              ) : (
                <>
                  <DyoSelect
                    className="mr-4"
                    value={auditFilter.eventType ?? 'none'}
                    onChange={it =>
                      actions.onAuditFilterChange({
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
                    isClearable
                    className="w-1/4"
                  />
                </>
              )}
            </div>
          </NodeSectionsHeading>

          {state.section === 'containers' ? (
            <NodeContainersList state={state} actions={actions} />
          ) : (
            <NodeAuditList state={state} />
          )}
        </>
      )}

      {!state.confirmationModal ? null : <DyoConfirmationModal config={state.confirmationModal} />}
    </Page>
  )
}

export default () => {
  const { nodeId } = useParams<NodeDetailsPageParams>()
  const [node, setNode] = useState<NodeDetails>(null)

  useEffect(() => {
    const fetchData = async () => {
      const node: NodeDetails = await fetcher(nodeApiDetailsUrl(nodeId))
      setNode(node)
    }
    fetchData()
  }, [])

  return node ? (
    <NodeDetailsPage node={node} />
  ) : (
    <div className="flex-1 flex items-center justify-center">
      <LoadingIndicator size="xl" />
    </div>
  )
}
