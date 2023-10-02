import { Layout } from '@app/components/layout'
import { BreadcrumbLink } from '@app/components/shared/breadcrumb'
import EventsTerminal from '@app/components/shared/events-terminal'
import PageHeading from '@app/components/shared/page-heading'
import DyoButton from '@app/elements/dyo-button'
import { DyoCard } from '@app/elements/dyo-card'
import { DyoHeading } from '@app/elements/dyo-heading'
import useWebSocket from '@app/hooks/use-websocket'
import {
  ContainerLogMessage,
  NodeDetails,
  WatchContainerLogMessage,
  WS_TYPE_CONTAINER_LOG,
  WS_TYPE_WATCH_CONTAINER_LOG,
} from '@app/models'
import { nodeApiDetailsUrl, nodeContainerLogUrl, nodeDetailsUrl, nodeWsDetailsUrl, ROUTE_NODES } from '@app/routes'
import { withContextAuthorization } from '@app/utils'
import { getBackendFromContext } from '@server/api'
import { NextPageContext } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

interface InstanceLogPageProps {
  node: NodeDetails
  prefix: string
  name: string
}

const NodeContainerLogPage = (props: InstanceLogPageProps) => {
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
    <Layout title={t('image')}>
      <PageHeading pageLink={pageLink} sublinks={sublinks}>
        <DyoButton className="ml-auto px-6 mr-2" secondary href={nodeDetailsUrl(node.id)}>
          {t('back')}
        </DyoButton>
      </PageHeading>

      <DyoCard className="p-4">
        <div className="flex mb-4 justify-between items-start">
          <DyoHeading element="h4" className="text-xl text-lens-bright">
            {t('log')}
          </DyoHeading>
        </div>

        <EventsTerminal events={log} formatEvent={it => [it.log]} />
      </DyoCard>
    </Layout>
  )
}

export default NodeContainerLogPage

const getPageServerSideProps = async (context: NextPageContext) => {
  const nodeId = context.query.nodeId as string
  const prefix = context.query.prefix as string
  const name = context.query.name as string

  const node = await getBackendFromContext<NodeDetails>(context, nodeApiDetailsUrl(nodeId))

  return {
    props: {
      node,
      prefix: prefix ?? null,
      name: name ?? null,
    },
  }
}

export const getServerSideProps = withContextAuthorization(getPageServerSideProps)
