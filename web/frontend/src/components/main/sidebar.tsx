import DyoIcon from '@app/elements/dyo-icon'
import { ROUTE_DASHBOARD, ROUTE_INDEX } from '@app/routes'
import useTranslation from 'next-translate/useTranslation'
import Image from 'next/image'
import Link from 'next/link'
import NavButton from './nav-button'
import { MenuOption, NavSection } from './nav-section'

export type MenuSection = {
  title: string
  items: MenuOption[]
}

export interface SidebarProps {
  className?: string
}

export const sidebarSections = [
  {
    title: 'components',
    items: [
      {
        icon: '/servers.svg',
        text: 'nodes',
        link: '/nodes',
      },
    ],
  },
]

export const Sidebar = (props: SidebarProps) => {
  const { className } = props

  const { t } = useTranslation('common')

  return (
    <div className={className}>
      <div className="mx-12">
        <Link href={ROUTE_INDEX} passHref>
          <Image className="cursor-pointer mt-4" src="/darklens_logo.svg" alt={t('logoAlt')} width={160} height={27} />
        </Link>
      </div>

      <div className="flex flex-col flex-grow pb-4">
        <div className="mt-6 flex text-lens-bright">
          <NavButton href={ROUTE_DASHBOARD} icon={<DyoIcon src="/dashboard.svg" alt={t('dashboard')} />}>
            {t('dashboard')}
          </NavButton>
        </div>

        {sidebarSections.map((it, index) => (
          <NavSection key={index} className="mt-6" title={t(it.title)} options={it.items} />
        ))}
      </div>
    </div>
  )
}
