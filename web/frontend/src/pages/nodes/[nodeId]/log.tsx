import { Page } from 'src/components/layout'
import { BreadcrumbLink } from 'src/components/shared/breadcrumb'
import EventsTerminal from 'src/components/shared/events-terminal'
import PageHeading from 'src/components/shared/page-heading'
import DyoButton from 'src/elements/dyo-button'
import { DyoCard } from 'src/elements/dyo-card'
import { DyoHeading } from 'src/elements/dyo-heading'
import useQuery from 'src/hooks/use-query'
import useWebSocket from 'src/hooks/use-websocket'
import {
  ContainerLogMessage,
  NodeDetails,
  WatchContainerLogMessage,
  WS_TYPE_CONTAINER_LOG,
  WS_TYPE_WATCH_CONTAINER_LOG,
} from 'src/models'
import { nodeApiDetailsUrl, nodeContainerLogUrl, nodeDetailsUrl, nodeWsDetailsUrl, ROUTE_NODES } from 'src/routes'
import { fetcher } from 'src/utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import LoadingIndicator from 'src/elements/loading-indicator'

type NodeContainerLogPageParams = {
  nodeId: string
}

type NodeContainerLogPageQuery = {
  prefix?: string
  name?: string
}

interface NodeContainerLogPageProps {
  node: NodeDetails
  prefix: string
  name: string
}

const NodeContainerLogPage = (props: NodeContainerLogPageProps) => {
  const { node, prefix, name } = props

  const { t } = useTranslation('common')

  const [log, setLog] = useState<ContainerLogMessage[]>([])

  const sock = useWebSocket(nodeWsDetailsUrl(node.id), {
    onOpen: () => {
      const request: WatchContainerLogMessage = {
        container: {
          prefix,
          name,
        },
      }

      sock.send(WS_TYPE_WATCH_CONTAINER_LOG, request)
    },
  })

  sock.on(WS_TYPE_CONTAINER_LOG, (message: ContainerLogMessage) => {
    setLog(prevLog => [...prevLog, message])
  })

  const pageLink: BreadcrumbLink = {
    name: t('nodes'),
    url: ROUTE_NODES,
  }

  const sublinks: BreadcrumbLink[] = [
    {
      name: node.name,
      url: `${nodeDetailsUrl(node.id)}`,
    },
    {
      name: t('log'),
      url: `${nodeContainerLogUrl(node.id, { prefix, name })}`,
    },
  ]

  return (
    <Page title={t('log')}>
      <PageHeading pageLink={pageLink} sublinks={sublinks}>
        <DyoButton className="ml-auto px-6 mr-2" secondary href={nodeDetailsUrl(node.id)}>
          {t('back')}
        </DyoButton>
      </PageHeading>

      <DyoCard className="p-4">
        <div className="flex mb-4 justify-between items-start">
          <DyoHeading element="h4" className="text-xl text-lens-bright">
            {t('logOf', { name: prefix ? `${prefix}-${name}` : name })}
          </DyoHeading>
        </div>

        <EventsTerminal events={log} formatEvent={it => [it.log]} />
      </DyoCard>
    </Page>
  )
}

export default () => {
  const { nodeId } = useParams<NodeContainerLogPageParams>()
  const { prefix, name } = useQuery<NodeContainerLogPageQuery>()
  const [node, setNode] = useState<NodeDetails>(null)

  useEffect(() => {
    const fetchData = async () => {
      const details: NodeDetails = await fetcher(nodeApiDetailsUrl(nodeId))

      setNode(details)
    }
    fetchData()
  }, [])

  return node ? <NodeContainerLogPage node={node} prefix={prefix} name={name} /> : <LoadingIndicator />
}
