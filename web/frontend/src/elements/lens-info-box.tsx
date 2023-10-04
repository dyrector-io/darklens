import clsx from 'clsx'
import { DyoHeading } from './dyo-heading'
import DyoIcon from './dyo-icon'
import infoIcon from 'src/assets/info.svg'

export type InfoBoxType = 'info'

export interface InfoBoxProps {
  type: InfoBoxType
  title: string
  className?: string
}

const types = {
  info: {
    icon: infoIcon,
    color: 'blue-500',
  },
}

const InfoBox = (props: React.PropsWithChildren<InfoBoxProps>) => {
  const { type, title, children, className } = props

  return (
    <div
      className={clsx(
        'bg-lens-medium-eased text-lens-bright p-4 border-l-4 rounded-r-lg',
        `border-${types[type].color}`,
        className,
      )}
    >
      <div className="flex flex-row">
        <DyoIcon size="md" src={types[type].icon} alt="" />

        <DyoHeading element="h4" className="text-md ml-2 mb-2">
          {title}
        </DyoHeading>
      </div>

      {children}
    </div>
  )
}

export default InfoBox
