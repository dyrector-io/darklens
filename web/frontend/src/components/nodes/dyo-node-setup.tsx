import DyoButton from 'src/elements/dyo-button'
import { DyoCard } from 'src/elements/dyo-card'
import DyoChips from 'src/elements/dyo-chips'
import DyoForm from 'src/elements/dyo-form'
import { DyoHeading } from 'src/elements/dyo-heading'
import DyoIcon from 'src/elements/dyo-icon'
import { DyoInput } from 'src/elements/dyo-input'
import { DyoLabel } from 'src/elements/dyo-label'
import TimeLabel from 'src/elements/time-label'
import useDyoFormik from 'src/hooks/use-dyo-formik'
import useTimer from 'src/hooks/use-timer'
import {
  NODE_INSTALL_SCRIPT_TYPE_VALUES,
  NodeDetails,
  NodeGenerateScript,
  NodeInstall,
  NodeInstallScriptType,
} from 'src/models'
import { writeToClipboard } from 'src/utils'
import { nodeGenerateScriptSchema } from 'src/validations'
import ShEditor from '../shared/sh-editor'
import { nodeApiScriptUrl } from 'src/routes'
import { useTranslation } from 'react-i18next'
import copyAlt from 'src/assets/copy-alt.svg'
import InfoBox from 'src/elements/lens-info-box'
import { useBackendDelete, useBackendFetch } from 'src/hooks/use-backend'

const expiresIn = (expireAt: Date): number => {
  const now = new Date().getTime()
  return (expireAt.getTime() - now) / 1000
}

interface DyoNodeSetupProps {
  node: NodeDetails
  onNodeInstallChanged: (install: NodeInstall) => void
}

const DyoNodeSetup = (props: DyoNodeSetupProps) => {
  const { node, onNodeInstallChanged } = props

  const { t } = useTranslation('nodes')

  const backendFetch = useBackendFetch(t)
  const backendDelete = useBackendDelete(t)

  const [remaining, startCountdown, cancelCountdown] = useTimer(
    node.install ? expiresIn(new Date(node.install.expireAt)) : null,
    () => onNodeInstallChanged(null),
  )

  const onDiscard = async () => {
    const res = await backendDelete(nodeApiScriptUrl(node.id))
    if (!res) {
      return
    }

    cancelCountdown()
    onNodeInstallChanged(null)
  }

  const onCopyScript = () => writeToClipboard(t, node.install.script)

  const formik = useDyoFormik<NodeGenerateScript>({
    initialValues: {
      scriptType: 'shell',
      hostAddress: '',
    },
    validationSchema: nodeGenerateScriptSchema,
    t,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true)

      if (remaining > 0) {
        cancelCountdown()
      }

      const res = await backendFetch<NodeGenerateScript, NodeInstall>('POST', nodeApiScriptUrl(node.id), values)

      if (!res.ok) {
        setSubmitting(false)
        return
      }

      const install = res.data

      startCountdown(expiresIn(new Date(install.expireAt)))

      onNodeInstallChanged(install)

      setSubmitting(false)
    },
  })

  return (
    <DyoCard>
      <DyoHeading element="h4" className="text-lg text-lens-text-0 mb-2">
        {t('agentInstall')}
      </DyoHeading>

      <InfoBox className="mb-2" type="info" title={t('whatScriptDoesHeader')}>
        <p className="text-lens-text-1">{t('scriptExplanation')}</p>
      </InfoBox>

      <DyoForm className="flex flex-col" onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
        {!node.install ? (
          <>
            <div className="flex flex-col">
              <DyoLabel className="text-lg mb-2.5" textColor="text-lens-text-0">
                {t('hostAddress')}
              </DyoLabel>

              <DyoInput
                name="hostAddress"
                placeholder={t('optionalLeaveEmptyForDefaults')}
                className="max-w-lg mb-2.5"
                grow
                value={formik.values.hostAddress}
                onChange={formik.handleChange}
                message={formik.errors.hostAddress}
              />
              <p className="text-sm text-lens-text-3 mb-2.5">{t('hostAddressExplanation')}</p>

              <DyoHeading element="h4" className="text-lg text-lens-text-0 mb-2">
                {t('type')}
              </DyoHeading>

              <DyoChips
                className="mb-2 ml-2"
                choices={NODE_INSTALL_SCRIPT_TYPE_VALUES}
                selection={formik.values.scriptType}
                converter={(it: NodeInstallScriptType) => t(`installScript.${it}`)}
                onSelectionChange={it => formik.setFieldValue('scriptType', it, true)}
              />
            </div>

            <DyoButton className="px-4 py-2 mt-4 mr-auto" type="submit">
              {t('generateScript')}
            </DyoButton>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <DyoLabel className="mb-2.5">{t('script')}</DyoLabel>

              <div className="h-82 w-full relative">
                <ShEditor className="h-82 w-full overflow-x-auto" readOnly value={node.install.script} />

                <div
                  onClick={onCopyScript}
                  className="absolute right-0 bottom-0 cursor-pointer ml-2 h-11 w-11 flex items-center justify-center"
                >
                  <DyoIcon size="md" src={copyAlt} alt={t('common:copy')} />
                </div>
              </div>

              <div className="flex flex-row">
                <DyoLabel className="text-white mr-2">{t('scriptExpiresIn')}</DyoLabel>

                <TimeLabel textColor="text-lens-turquoise" seconds={remaining} />
              </div>
            </div>

            <div className="flex flex-row mt-4 mb-4">
              <DyoButton className="px-4 py-2 mr-4" secondary onClick={onDiscard}>
                {t('common:discard')}
              </DyoButton>
            </div>
          </>
        )}
      </DyoForm>
    </DyoCard>
  )
}

export default DyoNodeSetup
