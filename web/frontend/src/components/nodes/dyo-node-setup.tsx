import DyoButton from 'src/elements/dyo-button'
import { DyoCard } from 'src/elements/dyo-card'
import DyoChips from 'src/elements/dyo-chips'
import DyoForm from 'src/elements/dyo-form'
import { DyoHeading } from 'src/elements/dyo-heading'
import DyoIcon from 'src/elements/dyo-icon'
import { DyoInput } from 'src/elements/dyo-input'
import { DyoLabel } from 'src/elements/dyo-label'
import DyoToggle from 'src/elements/dyo-toggle'
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

  const onCopyScript = () => writeToClipboard(t, node.install.command)

  const formik = useDyoFormik<NodeGenerateScript>({
    initialValues: {
      rootPath: '',
      scriptType: 'shell',
      dagentTraefik: null,
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

  const onTraefikChanged = it => formik.setFieldValue('dagentTraefik', it ? {} : null)

  return (
    <DyoCard>
      <DyoHeading element="h4" className="text-lg text-lens-bright mb-2">
        {t('agentInstall')}
      </DyoHeading>

      <InfoBox className="mb-2" type="info" title={t('whatScriptDoesHeader')}>
        <p className="text-lens-light-eased">{t('scriptExplanation')}</p>
      </InfoBox>

      <DyoForm className="flex flex-col" onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
        {!node.install ? (
          <>
            <div className="flex flex-col">
              <DyoHeading element="h4" className="text-lg text-lens-bright flex flex-row items-center">
                <DyoToggle
                  className="mr-2 my-2"
                  labelClassName="text-lens-light-eased mr-4"
                  name="traefik"
                  checked={!!formik.values.dagentTraefik}
                  onCheckedChange={onTraefikChanged}
                />

                {t('traefik')}
              </DyoHeading>

              <p className="text-sm text-lens-bright-muted mb-2.5">{t('traefikExplanation')}</p>

              {formik.values.dagentTraefik && (
                <div className="mb-2">
                  <DyoLabel className="text-md mb-2" textColor="text-lens-bright">
                    {t('traefikAcmeEmail')}
                  </DyoLabel>

                  <DyoInput
                    name="dagentTraefik.acmeEmail"
                    className="max-w-lg mb-2.5"
                    grow
                    value={formik.values.dagentTraefik.acmeEmail ?? ''}
                    onChange={formik.handleChange}
                    message={formik.errors.dagentTraefik ? formik.errors.dagentTraefik.acmeEmail : null}
                  />
                </div>
              )}

              <DyoLabel className="text-lg mb-2.5" textColor="text-lens-bright">
                {t('persistentDataPath')}
              </DyoLabel>

              <DyoInput
                name="rootPath"
                placeholder={t('optionalLeaveEmptyForDefaults')}
                className="max-w-lg mb-2.5"
                grow
                value={formik.values.rootPath}
                onChange={formik.handleChange}
                message={formik.errors.rootPath}
              />
              <p className="text-sm text-lens-bright-muted mb-2.5">{t('persistentDataExplanation')}</p>

              <DyoHeading element="h4" className="text-lg text-lens-bright mb-2">
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
              <DyoLabel className="mt-8 mb-2.5 whitespace-nowrap">{t('command')}</DyoLabel>

              <div className="flex flex-row items-center">
                <DyoInput
                  className="bg-gray-900"
                  containerClassName="flex-1"
                  readOnly
                  grow
                  defaultValue={node.install.command}
                  onFocus={ev => ev.target.select()}
                />

                <div onClick={onCopyScript} className="cursor-pointer ml-2 h-11 w-11 flex items-center justify-center">
                  <DyoIcon size="md" src={copyAlt} alt={t('common:copy')} />
                </div>
              </div>

              <div className="flex flex-row mt-2">
                <DyoLabel className="text-white mr-2">{t('scriptExpiresIn')}</DyoLabel>

                <TimeLabel textColor="text-lens-turquoise" seconds={remaining} />
              </div>
            </div>

            <div className="flex flex-row mt-4 mb-4">
              <DyoButton className="px-4 py-2 mr-4" secondary onClick={onDiscard}>
                {t('common:discard')}
              </DyoButton>
            </div>

            <div className="flex flex-col">
              <DyoLabel className="mb-2.5">{t('script')}</DyoLabel>

              <ShEditor className="h-48 mb-4 w-full overflow-x-auto" readOnly value={node.install.script} />
            </div>
          </>
        )}
      </DyoForm>
    </DyoCard>
  )
}

export default DyoNodeSetup
