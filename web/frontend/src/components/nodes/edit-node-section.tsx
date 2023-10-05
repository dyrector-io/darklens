import DyoButton from 'src/elements/dyo-button'
import { DyoCard } from 'src/elements/dyo-card'
import { DyoHeading } from 'src/elements/dyo-heading'
import { DyoConfirmationModal } from 'src/elements/dyo-modal'
import useConfirmation from 'src/hooks/use-confirmation'
import useWebSocket from 'src/hooks/use-websocket'
import { NodeDetails, NodeEventMessage, NodeInstall, WS_TYPE_NODE_EVENT } from 'src/models'
import clsx from 'clsx'
import { MutableRefObject } from 'react'
import toast from 'react-hot-toast'
import DyoNodeSetup from './dyo-node-setup'
import EditNodeCard from './edit-node-card'
import NodeConnectionCard from './node-connection-card'
import useNodeState from './use-node-state'
import { WS_NODES, nodeApiTokenUrl } from 'src/routes'
import { useTranslation } from 'react-i18next'
import { useBackendDelete } from 'src/hooks/use-backend'

interface EditNodeSectionProps {
  className?: string
  node?: NodeDetails
  onNodeEdited: (node: NodeDetails, shouldClose?: boolean) => void
  submitRef?: MutableRefObject<() => Promise<any>>
}

const EditNodeSection = (props: EditNodeSectionProps) => {
  const { className, node: propsNode, onNodeEdited: propsOnNodeEdited, submitRef } = props

  const { t } = useTranslation('nodes')

  const backendDelete = useBackendDelete()

  const [revokeModalConfig, confirmTokenRevoke] = useConfirmation()

  const [node, setNode] = useNodeState(
    propsNode ??
      ({
        name: '',
        description: '',
        status: 'unreachable',
      } as NodeDetails),
  )

  const editing = !!node.id

  const onNodeEdited = (newNode: NodeDetails, shouldClose?: boolean) => {
    setNode(newNode)
    propsOnNodeEdited(newNode, shouldClose)
  }

  const socket = useWebSocket(WS_NODES)
  socket.on(WS_TYPE_NODE_EVENT, (message: NodeEventMessage) => {
    if (message.id !== node.id) {
      return
    }

    if (message.error) {
      toast(t('updateError', { error: message.error }), {
        className: '!bg-lens-warning-orange !text-white',
      })
    }

    const newNode = {
      ...node,
      address: message.address ?? node.address,
      status: message.status,
      hasToken: message.status === 'connected' || node.hasToken,
      install: message.status === 'connected' ? null : node.install,
    } as NodeDetails

    onNodeEdited(newNode)
  })

  const onNodeInstallChanged = (install: NodeInstall) => {
    const newNode = {
      ...node,
      install,
    }

    onNodeEdited(newNode)
  }

  const onRevokeToken = async () => {
    const confirmed = await confirmTokenRevoke({
      title: t('tokens:areYouSureRevoke'),
      confirmText: t('tokens:revoke'),
      confirmColor: 'bg-lens-error-red',
    })

    if (!confirmed) {
      return
    }

    const res = await backendDelete(nodeApiTokenUrl(node.id))

    if (!res) {
      return
    }

    const newNode = {
      ...node,
      status: 'unreachable',
      version: null,
      hasToken: false,
      install: null,
    } as NodeDetails

    setNode(newNode)
    onNodeEdited(newNode)
  }

  return (
    <>
      <div className={clsx(className, 'flex flex-row gap-4')}>
        <EditNodeCard className="w-1/2 p-8" submitRef={submitRef} onNodeEdited={onNodeEdited} node={node} />

        <div className="flex flex-col flex-grow w-1/2">
          {node.hasToken && <NodeConnectionCard className="mb-4 p-6" node={node} />}

          {!editing ? (
            <DyoCard className="h-full text-lens-bright p-8">{t('youCanInstall')}</DyoCard>
          ) : node.hasToken ? (
            <DyoCard className="flex flex-col h-full p-8 text-lens-bright">
              <DyoHeading element="h4" className="text-lg text-lens-bright">
                {t('agentSettings')}
              </DyoHeading>

              {node.updatable && (
                <span className="mt-4">{t(node.status === 'outdated' ? 'updateRequired' : 'updateAvailable')}</span>
              )}

              <div className="flex flex-row gap-4 mt-4">
                {node.hasToken && (
                  <DyoButton className="px-6" secondary onClick={onRevokeToken}>
                    {t('tokens:revoke')}
                  </DyoButton>
                )}
              </div>
            </DyoCard>
          ) : (
            <DyoNodeSetup node={node} onNodeInstallChanged={onNodeInstallChanged} />
          )}
        </div>
      </div>

      <DyoConfirmationModal config={revokeModalConfig} className="w-1/4" />
    </>
  )
}

export default EditNodeSection
