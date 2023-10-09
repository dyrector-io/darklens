import { Page } from 'src/components/layout'
import EventsTerminal from 'src/components/shared/events-terminal'
import PageHeading from 'src/components/shared/page-heading'
import useQuery from 'src/hooks/use-query'
import useWebSocket from 'src/hooks/use-websocket'
import {
  ContainerLogMessage,
  WatchContainerLogMessage,
  WS_TYPE_CONTAINER_LOG,
  WS_TYPE_WATCH_CONTAINER_LOG,
} from 'src/models'
import { nodeDetailsUrl, nodeWsDetailsUrl } from 'src/routes'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

type NodeContainerLogPageParams = {
  nodeId: string
}

type NodeContainerLogPageQuery = {
  prefix?: string
  name?: string
}

const NodeContainerLogPage = () => {
  const { nodeId } = useParams<NodeContainerLogPageParams>()
  const { prefix, name } = useQuery<NodeContainerLogPageQuery>()

  const { t } = useTranslation('common')

  const [log, setLog] = useState<ContainerLogMessage[]>([])

  const sock = useWebSocket(nodeWsDetailsUrl(nodeId), {
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

  return (
    <Page title={t('log')}>
      <PageHeading title={t('logOf', { name: prefix ? `${prefix}-${name}` : name })} backTo={nodeDetailsUrl(nodeId)} />

      <EventsTerminal events={log} formatEvent={it => [it.log]} />
    </Page>
  )
}

export default NodeContainerLogPage
