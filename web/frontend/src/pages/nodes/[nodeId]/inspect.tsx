import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Page } from 'src/components/layout'
import { BreadcrumbLink } from 'src/components/shared/breadcrumb'
import JsonEditor from 'src/components/shared/json-editor-dynamic-module'
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

const NodeContainerInspectPage = (props: ContainerInspectPageProps) => {
  const { inspect, node, prefix, name } = props

  const { t } = useTranslation('common')
  const { t } = useTranslation('nodes')

  const pageLink: BreadcrumbLink = {
    name: t('nodes'),
    name: t('common:nodes'),
    url: ROUTE_NODES,
  }

  const sublinks: BreadcrumbLink[] = [
    {
      name: node.name,
      url: `${nodeDetailsUrl(node.id)}`,
    },
    {
      name: t('log'),
      name: t('common:log'),
      url: `${nodeContainerInspectUrl(node.id, { prefix, name })}`,
    },
  ]

  return (
    <Page title={t('image')}>
    <Page title={t('common:inspect')}>
      <PageHeading pageLink={pageLink} sublinks={sublinks}>
        <DyoButton className="ml-auto px-6" secondary href={nodeDetailsUrl(node.id)}>
          {t('back')}
          {t('common:back')}
        </DyoButton>
      </PageHeading>

      <DyoCard className="p-4">
        <div className="flex mb-4 justify-between items-start">
          <DyoHeading element="h4" className="text-xl text-lens-bright">
            {t('inspectOf', { name: prefix ? `${prefix}-${name}` : name })}
          <DyoHeading element="h4" className="text-xl text-lens-text-0">
            {t('common:inspectOf', { name: prefix ? `${prefix}-${name}` : name })}
          </DyoHeading>
        </div>

        <JsonEditor value={inspect} disabled />
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
