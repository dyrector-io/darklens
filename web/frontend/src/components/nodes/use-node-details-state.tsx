import { DyoConfirmationModalConfig } from '@app/elements/dyo-modal'
import useConfirmation from '@app/hooks/use-confirmation'
import { FilterConfig, TextFilter, textFilterFor, useFilters } from '@app/hooks/use-filters'
import useWebSocket from '@app/hooks/use-websocket'
import {
  Container,
  ContainerCommandMessage,
  ContainerOperation,
  containerPrefixNameOf,
  ContainersStateListMessage,
  ContainerState,
  DeleteContainerMessage,
  NodeDetails,
  WatchContainerStatusMessage,
  WS_TYPE_CONTAINERS_STATE_LIST,
  WS_TYPE_CONTAINER_COMMAND,
  WS_TYPE_DELETE_CONTAINER,
  WS_TYPE_WATCH_CONTAINERS_STATE,
  NodeEventType,
} from '@app/models'
import { getEndOfToday, utcDateToLocale } from '@app/utils'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'
import { PaginationSettings } from '../shared/paginator'
import useNodeState from './use-node-state'
import { nodeWsDetailsUrl } from '@app/routes'

const sixDays = 1000 * 60 * 60 * 24 * 6 // ms * minutes * hours * day * six

export type NodeDetailsSection = 'editing' | 'containers' | 'logs'

export type ContainerTargetStates = { [key: string]: ContainerState } // containerName to targetState

export type NodeAuditFilter = {
  from: Date
  to: Date
  eventType: NodeEventType
}

export type NodeDetailsState = {
  section: NodeDetailsSection
  node: NodeDetails
  confirmationModal: DyoConfirmationModalConfig
  containerTargetStates: ContainerTargetStates
  containerFilters: FilterConfig<Container, TextFilter>
  containerPagination: PaginationSettings
  containerItems: Container[]
  auditFilter: NodeAuditFilter
}

export type NodeDetailsActions = {
  onNodeEdited: (node: NodeDetails, shouldClose?: boolean) => void
  setSection: (section: NodeDetailsSection) => void
  setEditing: (editing: boolean) => void
  setContainerPagination: (pagination: PaginationSettings) => void
  onStartContainer: (container: Container) => void
  onStopContainer: (container: Container) => void
  onRestartContainer: (container: Container) => void
  onDeleteContainer: (container: Container) => void
  onAuditFilterChange: (filter: Partial<NodeAuditFilter>) => void
}

export type NodeDetailsStateOptions = {
  node: NodeDetails
}

const useNodeDetailsState = (options: NodeDetailsStateOptions): [NodeDetailsState, NodeDetailsActions] => {
  const { t } = useTranslation('common')

  const [section, setSection] = useState<NodeDetailsSection>('containers')
  const [node, setNode] = useNodeState(options.node)
  const [confirmationModal, confirm] = useConfirmation()

  const sock = useWebSocket(nodeWsDetailsUrl(node.id))

  const onNodeEdited = (newNode: NodeDetails, shouldClose?: boolean) => {
    if (shouldClose) {
      setSection('containers')
    }

    setNode(newNode)
  }

  const [containerTargetStates, setContainerTargetStates] = useState<ContainerTargetStates>({})
  const [containerPagination, setContainerPagination] = useState<PaginationSettings>({
    pageNumber: 0,
    pageSize: 10,
  })
  const containerFilters = useFilters<Container, TextFilter>({
    initialData: [],
    filters: [
      textFilterFor<Container>(it => [
        it.id.name,
        it.id.prefix,
        it.state,
        it.reason,
        it.imageName,
        it.imageTag,
        utcDateToLocale(it.createdAt),
      ]),
    ],
  })

  const endOfToday = getEndOfToday()
  const [auditFilter, setAuditFilter] = useState<NodeAuditFilter>({
    from: new Date(endOfToday.getTime() - sixDays),
    to: new Date(endOfToday),
    eventType: null,
  })

  const currentPageNumber =
    containerPagination.pageNumber * containerPagination.pageSize >= containerFilters.filtered.length
      ? Math.floor(containerFilters.filtered.length / containerPagination.pageSize)
      : containerPagination.pageNumber

  useEffect(() => {
    if (node.status === 'connected') {
      sock.send(WS_TYPE_WATCH_CONTAINERS_STATE, { prefix: '' } as WatchContainerStatusMessage)
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
      const { state } = container
      const name = containerPrefixNameOf(container.id)

      const targetState = containerTargetStates[name]
      if (targetState && targetState === state) {
        delete newTargetStates[name]
      }
    })

    if (Object.keys(newTargetStates).length !== Object.keys(containerTargetStates).length) {
      setContainerTargetStates(newTargetStates)
    }
  })

  const onAuditFilterChange = (filter: Partial<NodeAuditFilter>) => {
    setAuditFilter({
      ...auditFilter,
      ...filter,
    })
  }

  const setEditing = (editing: boolean) => setSection(editing ? 'editing' : 'containers')

  const sendContainerCommand = (container: Container, operation: ContainerOperation) => {
    sock.send(WS_TYPE_CONTAINER_COMMAND, {
      container: container.id,
      operation,
    } as ContainerCommandMessage)
  }

  const setTargetStateFor = (container: Container, state: ContainerState) => {
    const newTargetStates = {
      ...containerTargetStates,
    }

    const name = containerPrefixNameOf(container.id)
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
      description: t('areYouSureDeleteName', { name: containerPrefixNameOf(container.id) }),
      confirmText: t('delete'),
      confirmColor: 'bg-lens-error-red',
    })

    if (!confirmed) {
      return
    }

    sock.send(WS_TYPE_DELETE_CONTAINER, {
      container: container.id,
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
      auditFilter,
    },
    {
      onNodeEdited,
      setSection,
      setEditing,
      setContainerPagination,
      onStartContainer,
      onStopContainer,
      onRestartContainer,
      onDeleteContainer,
      onAuditFilterChange,
    },
  ]
}

export default useNodeDetailsState