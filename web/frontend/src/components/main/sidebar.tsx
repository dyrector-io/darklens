import { ROUTE_INDEX } from '@app/routes'
import useTranslation from 'next-translate/useTranslation'
import Image from 'next/image'
import Link from 'next/link'
import NavButton from './nav-button'
import DyoIcon from '@app/elements/dyo-icon'

export type MenuOption = {
  icon: string
  text: string
  link: string
}

export interface SidebarProps {
  className?: string
}

export const sidebarSections = [
  {
    icon: '/servers.svg',
    text: 'nodes',
    link: '/nodes',
  },
]

export const Sidebar = (props: SidebarProps) => {
  const { className } = props

  const { t } = useTranslation('common')

  const optionToIcon = (it: MenuOption) => <DyoIcon src={it.icon} alt={t(it.text)} />

  return (
    <div className={className}>
      <div className="mx-12">
        <Link href={ROUTE_INDEX} passHref>
          <Image className="cursor-pointer mt-1" src="/darklens_logo.svg" alt={t('logoAlt')} width={160} height={27} />
        </Link>
      </div>

      <div className="flex flex-col flex-grow pb-4">
        <ul className="list-none flex flex-col text-lens-bright">
          {sidebarSections.map((option, index) => (
            <li key={index} className="flex flex-row items-center mt-2">
              <NavButton href={option.link} icon={optionToIcon(option)} target={option.link}>
                {t(option.text)}
              </NavButton>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
