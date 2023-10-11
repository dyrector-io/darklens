import { DyoConfirmationModalConfig } from 'src/elements/dyo-modal'
import useConfirmation from 'src/hooks/use-confirmation'
import { FilterConfig, TextFilter, textFilterFor, useFilters } from 'src/hooks/use-filters'
import useWebSocket from 'src/hooks/use-websocket'
import {
  Container,
  ContainerCommandMessage,
  ContainerOperation,
  ContainersStateListMessage,
  ContainerState,
  DeleteContainerMessage,
  NodeDetails,
  WatchContainerStatusMessage,
  WS_TYPE_CONTAINERS_STATE_LIST,
  WS_TYPE_CONTAINER_COMMAND,
  WS_TYPE_DELETE_CONTAINER,
  WS_TYPE_WATCH_CONTAINERS_STATE,
} from 'src/models'
import { utcDateToLocale } from 'src/utils'
import { useEffect, useState } from 'react'
import { PaginationSettings } from '../shared/paginator'
import useNodeState from './use-node-state'
import { nodeWsDetailsUrl } from 'src/routes'
import { useTranslation } from 'react-i18next'

export type NodeDetailsSection = 'editing' | 'containers'

export type ContainerTargetStates = { [key: string]: ContainerState } // containerName to targetState

export type NodeDetailsState = {
  section: NodeDetailsSection
  node: NodeDetails
  confirmationModal: DyoConfirmationModalConfig
  containerTargetStates: ContainerTargetStates
  containerFilters: FilterConfig<Container, TextFilter>
  containerPagination: PaginationSettings
  containerItems: Container[]
}

export type NodeDetailsActions = {
  setNode: (node: NodeDetails) => void
  setSection: (section: NodeDetailsSection) => void
  setContainerPagination: (pagination: PaginationSettings) => void
  onStartContainer: (container: Container) => void
  onStopContainer: (container: Container) => void
  onRestartContainer: (container: Container) => void
  onDeleteContainer: (container: Container) => void
}

const useNodeDetailsState = (nodeId: string): [NodeDetailsState, NodeDetailsActions] => {
  const { t } = useTranslation('common')

  const [section, setSection] = useState<NodeDetailsSection>('containers')
  const [node, setNode] = useNodeState(
    {
      name: '',
      description: '',
      status: 'unreachable',
    } as NodeDetails,
    nodeId,
  )
  const [confirmationModal, confirm] = useConfirmation()

  const sock = useWebSocket(nodeWsDetailsUrl(nodeId))

  const [containerTargetStates, setContainerTargetStates] = useState<ContainerTargetStates>({})
  const [containerPagination, setContainerPagination] = useState<PaginationSettings>({
    pageNumber: 0,
    pageSize: 10,
  })
  const containerFilters = useFilters<Container, TextFilter>({
    initialData: [],
    filters: [
      textFilterFor<Container>(it => [
        it.name,
        it.state,
        it.reason,
        it.imageName,
        it.imageTag,
        utcDateToLocale(it.createdAt),
      ]),
    ],
  })

  const currentPageNumber =
    containerPagination.pageNumber * containerPagination.pageSize >= containerFilters.filtered.length
      ? Math.floor(containerFilters.filtered.length / containerPagination.pageSize)
      : containerPagination.pageNumber

  useEffect(() => {
    if (node.status === 'connected') {
      sock.send(WS_TYPE_WATCH_CONTAINERS_STATE, {} as WatchContainerStatusMessage)
    }
  }, [node.status, sock])

  useEffect(() => {
    if (node.status !== 'connected' && containerFilters.items.length > 0) {
      containerFilters.setItems([])
    }
  }, [node.status, containerFilters])

  useEffect(() => {
    if (currentPageNumber !== containerPagination.pageNumber) {
      setContainerPagination({
        ...containerPagination,
        pageNumber: currentPageNumber,
      })
    }
  }, [containerFilters.filtered])

  sock.on(WS_TYPE_CONTAINERS_STATE_LIST, (message: ContainersStateListMessage) => {
    containerFilters.setItems(message.containers)

    const newTargetStates = {
      ...containerTargetStates,
    }
    message.containers.forEach(container => {
      const { state, name } = container

      const targetState = containerTargetStates[name]
      if (targetState && targetState === state) {
        delete newTargetStates[name]
      }
    })

    if (Object.keys(newTargetStates).length !== Object.keys(containerTargetStates).length) {
      setContainerTargetStates(newTargetStates)
    }
  })

  const sendContainerCommand = (container: Container, operation: ContainerOperation) => {
    sock.send(WS_TYPE_CONTAINER_COMMAND, {
      container: container.name,
      operation,
    } as ContainerCommandMessage)
  }

  const setTargetStateFor = (container: Container, state: ContainerState) => {
    const newTargetStates = {
      ...containerTargetStates,
    }

    const { name } = container
    newTargetStates[name] = state
    setContainerTargetStates(newTargetStates)
  }

  const onStartContainer = (container: Container) => {
    setTargetStateFor(container, 'running')
    sendContainerCommand(container, 'start')
  }

  const onStopContainer = (container: Container) => {
    setTargetStateFor(container, 'exited')
    sendContainerCommand(container, 'stop')
  }

  const onRestartContainer = (container: Container) => {
    setTargetStateFor(container, 'running')
    sendContainerCommand(container, 'restart')
  }

  const onDeleteContainer = async (container: Container) => {
    const confirmed = await confirm({
      title: t('areYouSure'),
      description: t('areYouSureDeleteName', { name: container.name }),
      confirmText: t('delete'),
      confirmColor: 'bg-lens-error-red',
    })

    if (!confirmed) {
      return
    }

    sock.send(WS_TYPE_DELETE_CONTAINER, {
      container: container.name,
    } as DeleteContainerMessage)
  }

  const containerItems = containerFilters.filtered.slice(
    currentPageNumber * containerPagination.pageSize,
    currentPageNumber * containerPagination.pageSize + containerPagination.pageSize,
  )

  return [
    {
      section,
      node,
      containerTargetStates,
      containerFilters,
      containerPagination,
      containerItems,
      confirmationModal,
    },
    {
      setNode,
      setSection,
      setContainerPagination,
      onStartContainer,
      onStopContainer,
      onRestartContainer,
      onDeleteContainer,
    },
  ]
}

export default useNodeDetailsState
