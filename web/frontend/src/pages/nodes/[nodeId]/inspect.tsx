import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Page } from 'src/components/layout'
import InspectTableView from 'src/components/nodes/inspect-table-view'
import InspectViewModeToggle, { InspectViewMode } from 'src/components/nodes/inspect-view-mode-toggle'
import JsonEditor from 'src/components/shared/json-editor'
import PageHeading from 'src/components/shared/page-heading'
import LoadingIndicator from 'src/elements/loading-indicator'
import { useBackendGet } from 'src/hooks/use-backend'
import useQuery from 'src/hooks/use-query'
import { NodeContainerInspection, NodeDetails } from 'src/models'
import { nodeApiDetailsUrl, nodeApiInspectUrl, nodeDetailsUrl } from 'src/routes'

type NodeContainerInspectPageParams = {
  nodeId: string
}

type NodeContainerInspectPageQuery = {
  prefix?: string
  name?: string
}

const NodeContainerInspectPage = () => {
  const { nodeId } = useParams<NodeContainerInspectPageParams>()
  const { prefix, name } = useQuery<NodeContainerInspectPageQuery>()
  const [inspect, setInspect] = useState<{ data: object; node: NodeDetails }>(null)

  const { t } = useTranslation('nodes')
  const [viewMode, setViewMode] = useState<InspectViewMode>('table')

  const backendGet = useBackendGet()

  useEffect(() => {
    const fetchData = async () => {
      const res = await backendGet<NodeContainerInspection>(nodeApiInspectUrl(nodeId, prefix, name))
      if (!res.ok) {
        return
      }

      const resNode = await backendGet<NodeDetails>(nodeApiDetailsUrl(nodeId))
      if (!resNode.ok) {
        return
      }

      setInspect({
        data: JSON.parse(res.data.inspection),
        node: resNode.data,
      })
    }
    fetchData()
  }, [])

  return (
    <Page title={t('common:inspect')}>
      <PageHeading
        title={t('common:inspectOf', { name: prefix ? `${prefix}-${name}` : name })}
        backTo={nodeDetailsUrl(nodeId)}
      >
        {inspect && <InspectViewModeToggle viewMode={viewMode} onViewModeChanged={setViewMode} />}
      </PageHeading>

      {inspect ? (
        viewMode === 'table' ? (
          <InspectTableView inspect={inspect.data} />
        ) : (
          <JsonEditor value={inspect.data} disabled />
        )
      ) : (
        <LoadingIndicator />
      )}
    </Page>
  )
}

export default NodeContainerInspectPage
