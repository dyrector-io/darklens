import { Layout } from '@app/components/layout'
import DyoNodeCard from '@app/components/nodes/dyo-node-card'
import EditNodeSection from '@app/components/nodes/edit-node-section'
import NodeAuditList from '@app/components/nodes/node-audit-list'
import NodeConnectionCard from '@app/components/nodes/node-connection-card'
import NodeContainersList from '@app/components/nodes/node-containers-list'
import NodeSectionsHeading from '@app/components/nodes/node-sections-heading'
import useNodeDetailsState from '@app/components/nodes/use-node-details-state'
import { BreadcrumbLink } from '@app/components/shared/breadcrumb'
import Filters from '@app/components/shared/filters'
import PageHeading from '@app/components/shared/page-heading'
import { DetailsPageMenu } from '@app/components/shared/page-menu'
import DyoChips from '@app/elements/dyo-chips'
import DyoDatePicker from '@app/elements/dyo-date-picker'
import { DyoInput } from '@app/elements/dyo-input'
import { DyoConfirmationModal } from '@app/elements/dyo-modal'
import { DyoSelect } from '@app/elements/dyo-select'
import { defaultApiErrorHandler } from '@app/errors'
import { NODE_EVENT_TYPE_VALUES, NodeDetails, NodeEventType } from '@app/models'
import { API_NODES, ROUTE_NODES, nodeApiDetailsUrl, nodeDetailsUrl } from '@app/routes'
import { withContextAuthorization } from '@app/utils'
import { getBackendFromContext } from '@server/api'
import { NextPageContext } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useRouter } from 'next/dist/client/router'
import { useRef } from 'react'
import { useSWRConfig } from 'swr'

interface NodeDetailsPageProps {
  node: NodeDetails
}

const NodeDetailsPage = (props: NodeDetailsPageProps) => {
  const { node: propsNode } = props

  const { t } = useTranslation('nodes')

  const { mutate } = useSWRConfig()

  const router = useRouter()

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

    await mutate(API_NODES, null)
    await router.push(ROUTE_NODES)
  }

  const onNodeEdited = async (edited: NodeDetails, shouldClose?: boolean) => {
    actions.onNodeEdited(edited, shouldClose)
    if (shouldClose) {
      await router.replace(ROUTE_NODES)
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

  return (
    <Layout title={t('nodesName', node)}>
      <PageHeading
        pageLink={pageLink}
        sublinks={[
          {
            name: node.name,
            url: `${nodeDetailsUrl(node.id)}`,
          },
        ]}
      >
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
                      <option value={it}>{t(`auditEvents.${it}`)}</option>
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
    </Layout>
  )
}

export default NodeDetailsPage

const getPageServerSideProps = async (context: NextPageContext) => {
  const nodeId = context.query.nodeId as string

  const node = await getBackendFromContext<NodeDetails>(context, nodeApiDetailsUrl(nodeId))

  return {
    props: {
      node,
    },
  }
}

export const getServerSideProps = withContextAuthorization(getPageServerSideProps)
