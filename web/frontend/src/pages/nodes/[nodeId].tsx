import { Page } from 'src/components/layout'
import NodeContainersList from 'src/components/nodes/node-containers-list'
import useNodeDetailsState from 'src/components/nodes/use-node-details-state'
import PageHeading from 'src/components/shared/page-heading'
import { DyoInput } from 'src/elements/dyo-input'
import { DyoConfirmationModal } from 'src/elements/dyo-modal'
import { NodeDetails } from 'src/models'
import { ROUTE_NODES, nodeApiDetailsUrl } from 'src/routes'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useBackendGet } from 'src/hooks/use-backend'
import { DyoHeading } from 'src/elements/dyo-heading'
import NodeStatusIndicator from 'src/components/nodes/node-status-indicator'

type NodeDetailsPageParams = {
  nodeId: string
}

const NodeDetailsPage = () => {
  const { nodeId } = useParams<NodeDetailsPageParams>()

  const backendGet = useBackendGet()
  const { t } = useTranslation('nodes')

  const [state, actions] = useNodeDetailsState(nodeId)
  const { node } = state
  const { setNode } = actions

  useEffect(() => {
    const fetchData = async () => {
      const res = await backendGet<NodeDetails>(nodeApiDetailsUrl(nodeId))
      if (!res.ok) {
        return
      }
      setNode(res.data)
    }
    fetchData()
  }, [])

  const title = (
    <div className="flex flex-row items-center">
      <NodeStatusIndicator className="place-items-center mr-2" status={node.status} />
      <DyoHeading element="h2" className="text-2xl text-lens-text-0">
        {node.name}
      </DyoHeading>
    </div>
  )

  return (
    <Page title={t('nodesName', node)}>
      <PageHeading title={title} backTo={ROUTE_NODES}>
        <DyoInput
          className={t('grow')}
          placeholder={t('common:search')}
          onChange={e => state.containerFilters.setFilter({ text: e.target.value })}
        />
      </PageHeading>

      <NodeContainersList state={state} actions={actions} />

      {!state.confirmationModal ? null : <DyoConfirmationModal config={state.confirmationModal} />}
    </Page>
  )
}

export default NodeDetailsPage
