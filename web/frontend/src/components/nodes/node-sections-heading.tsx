import DyoButton from '@app/elements/dyo-button'
import useTranslation from 'next-translate/useTranslation'
import { NodeDetailsSection } from './use-node-details-state'

interface NodeSectionsHeadingProps {
  section: NodeDetailsSection
  setSection: (section: NodeDetailsSection) => void
}

const NodeSectionsHeading = (props: React.PropsWithChildren<NodeSectionsHeadingProps>) => {
  const { section, setSection, children } = props

  const { t } = useTranslation('nodes')

  return (
    <div className="flex flex-row mb-4 mt-6">
      <DyoButton
        text
        thin
        underlined={section === 'containers'}
        textColor="text-lens-bright"
        className="mx-6"
        onClick={() => setSection('containers')}
      >
        {t('containers')}
      </DyoButton>

      <DyoButton
        text
        thin
        underlined={section === 'logs'}
        textColor="text-lens-bright"
        className="mx-6"
        onClick={() => setSection('logs')}
      >
        {t('logs')}
      </DyoButton>

      { children }
    </div>
  )
}

export default NodeSectionsHeading
