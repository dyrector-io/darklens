import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Page } from 'src/components/layout'
import InspectTableView from 'src/components/nodes/inspect-table-view'
import { BreadcrumbLink } from 'src/components/shared/breadcrumb'
import JsonEditor from 'src/components/shared/json-editor'
import PageHeading from 'src/components/shared/page-heading'
import DyoButton from 'src/elements/dyo-button'
import { DyoCard } from 'src/elements/dyo-card'
import { DyoHeading } from 'src/elements/dyo-heading'
import LoadingIndicator from 'src/elements/loading-indicator'
import { useBackendGet } from 'src/hooks/use-backend'
import useQuery from 'src/hooks/use-query'
import { NodeContainerInspection, NodeDetails } from 'src/models'
import { ROUTE_NODES, nodeApiDetailsUrl, nodeApiInspectUrl, nodeContainerInspectUrl, nodeDetailsUrl } from 'src/routes'

type NodeContainerInspectPageParams = {
  nodeId: string
}

type NodeContainerInspectPageQuery = {
  prefix?: string
  name?: string
}

interface ContainerInspectPageProps {
  node: NodeDetails
  inspect: object
  prefix: string
  name: string
}

type ViewState = 'table' | 'json'

const NodeContainerInspectPage = (props: ContainerInspectPageProps) => {
  const { inspect, node, prefix, name } = props

  const { t } = useTranslation('nodes')
  const [viewState, setViewState] = useState<ViewState>('table')

  const pageLink: BreadcrumbLink = {
    name: t('common:nodes'),
    url: ROUTE_NODES,
  }

  const sublinks: BreadcrumbLink[] = [
    {
      name: node.name,
      url: `${nodeDetailsUrl(node.id)}`,
    },
    {
      name: t('common:log'),
      url: `${nodeContainerInspectUrl(node.id, { prefix, name })}`,
    },
  ]

  return (
    <Page title={t('common:inspect')}>
      <PageHeading pageLink={pageLink} sublinks={sublinks}>
        <DyoButton className="ml-auto px-6" secondary href={nodeDetailsUrl(node.id)}>
          {t('common:back')}
        </DyoButton>
      </PageHeading>

      <DyoCard className="p-4">
        <div className="flex mb-4 justify-between items-start">
          <DyoHeading element="h4" className="text-xl text-lens-text-0">
            {t('common:inspectOf', { name: prefix ? `${prefix}-${name}` : name })}
          </DyoHeading>

          <div className="flex">
            <DyoButton
              text
              thin
              textColor="text-lens-text-0"
              underlined={viewState === 'table'}
              onClick={() => setViewState('table')}
              heightClassName="pb-2"
              className="mx-4"
            >
              {t('table')}
            </DyoButton>

            <DyoButton
              text
              thin
              textColor="text-lens-text-0"
              underlined={viewState === 'json'}
              onClick={() => setViewState('json')}
              className="mx-4"
              heightClassName="pb-2"
            >
              {t('json')}
            </DyoButton>
          </div>
        </div>

        {viewState === 'table' ? <InspectTableView inspect={inspect} /> : <JsonEditor value={inspect} disabled />}
      </DyoCard>
    </Page>
  )
}

export default () => {
  const { nodeId } = useParams<NodeContainerInspectPageParams>()
  const { prefix, name } = useQuery<NodeContainerInspectPageQuery>()
  const [inspect, setInspect] = useState<{ data: object; node: NodeDetails }>(null)

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

  return inspect ? (
    <NodeContainerInspectPage inspect={inspect.data} node={inspect.node} prefix={prefix} name={name} />
  ) : (
    <LoadingIndicator />
  )
}
