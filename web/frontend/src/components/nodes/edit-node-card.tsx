import DyoButton from 'src/elements/dyo-button'
import { DyoCard } from 'src/elements/dyo-card'
import DyoForm from 'src/elements/dyo-form'
import { DyoHeading } from 'src/elements/dyo-heading'
import DyoIconPicker from 'src/elements/dyo-icon-picker'
import { DyoInput } from 'src/elements/dyo-input'
import { DyoLabel } from 'src/elements/dyo-label'
import DyoTextArea from 'src/elements/dyo-text-area'
import useDyoFormik from 'src/hooks/use-dyo-formik'
import { CreateNode, NodeDetails, UpdateNode } from 'src/models'
import { API_NODES, nodeApiDetailsUrl } from 'src/routes'
import { nodeSchema } from 'src/validations'
import clsx from 'clsx'
import { MutableRefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useBackendFetch } from 'src/hooks/use-backend'

type EditNodeCardProps = {
  className?: string
  node: NodeDetails
  onNodeEdited: (node: NodeDetails, shouldClose?: boolean) => void
  submitRef?: MutableRefObject<() => Promise<any>>
}

const EditNodeCard = (props: EditNodeCardProps) => {
  const { className, node, onNodeEdited, submitRef } = props

  const { t } = useTranslation('nodes')
  const backendFetch = useBackendFetch()

  const editing = !!node.id

  const formik = useDyoFormik({
    submitRef,
    initialValues: node,
    validationSchema: nodeSchema,
    t,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      setSubmitting(true)

      const body: CreateNode | UpdateNode = {
        ...values,
      }

      const res = await (!editing
        ? backendFetch<CreateNode, NodeDetails>('POST', API_NODES, body as CreateNode, setFieldError)
        : backendFetch<UpdateNode, NodeDetails>('PUT', nodeApiDetailsUrl(node.id), body as UpdateNode, setFieldError))

      if (res.ok) {
        let result: NodeDetails
        if (res.data) {
          result = {
            ...res.data,
            status: node.status,
          } as NodeDetails
        } else {
          result = {
            ...values,
            id: node.id,
            status: node.status,
          } as NodeDetails
        }

        setSubmitting(false)
        onNodeEdited(result, editing)
      } else {
        setSubmitting(false)
      }
    },
  })

  const inputClassName = 'my-2 w-full'

  return (
    <DyoCard className={className}>
      <DyoHeading element="h4" className="text-lg text-lens-text-0">
        {editing ? t('common:editName', { name: node.name }) : t('new')}
      </DyoHeading>

      <DyoLabel textColor="text-lens-text-3">{t('tips')}</DyoLabel>

      <DyoForm className="flex flex-col" onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
        <DyoInput
          name="name"
          label={t('common:name')}
          onChange={formik.handleChange}
          value={formik.values.name}
          required
          grow
          message={formik.errors.name}
        />

        <div className={inputClassName}>
          <DyoLabel>{t('common:icon')}</DyoLabel>

          <DyoIconPicker name="icon" value={formik.values.icon} setFieldValue={formik.setFieldValue} />
        </div>

        <DyoTextArea
          className={clsx(inputClassName, 'h-48')}
          name="description"
          label={t('common:description')}
          onChange={formik.handleChange}
          value={formik.values.description}
          grow
        />

        <DyoButton className="hidden" type="submit" />
      </DyoForm>
    </DyoCard>
  )
}

export default EditNodeCard
