import DyoButton from 'src/elements/dyo-button'
import { NodeDetailsSection } from './use-node-details-state'
import { useTranslation } from 'react-i18next'

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
        textColor="text-lens-text-0"
        className="mx-6"
        onClick={() => setSection('containers')}
      >
        {t('containers')}
      </DyoButton>

      <DyoButton
        text
        thin
        underlined={section === 'logs'}
        textColor="text-lens-text-0"
        className="mx-6"
        onClick={() => setSection('logs')}
      >
        {t('logs')}
      </DyoButton>

      {children}
    </div>
  )
}

export default NodeSectionsHeading
