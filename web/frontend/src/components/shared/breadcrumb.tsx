import { DyoHeading } from 'src/elements/dyo-heading'
import DyoIcon from 'src/elements/dyo-icon'
import { DyoLabel } from 'src/elements/dyo-label'
import { ROUTE_INDEX } from 'src/routes'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import breadcrumbHome from 'src/assets/breadcrumb_home.svg'
import breadcrumbNext from 'src/assets/breadcrumb_next.svg'
import servers from 'src/assets/servers.svg'

export type BreadcrumbLink = {
  name: string
  url: string
}

export interface BreadcrumbProps {
  page: string
  pageUrl: string
  links?: BreadcrumbLink[]
}

export const sections = [
  {
    icon: servers,
    text: 'nodes',
    link: '/nodes',
  },
]

const Breadcrumb = (props: BreadcrumbProps) => {
  const { page, pageUrl, links } = props

  const { t } = useTranslation('common')

  const homeMenu = sections.find(it => it.link === pageUrl)

  return (
    <div key="breadcrumb" className="flex flex-row items-center w-1/2 flex-grow">
      <DyoHeading element="h2" className="text-2xl text-lens-text-0">
        {page}
      </DyoHeading>

      <div className="bg-lens-surface-2 w-px h-8 mx-6" />

      <Link to={homeMenu?.link ?? ROUTE_INDEX}>
        <DyoIcon
          className="cursor-pointer"
          src={homeMenu?.icon ?? breadcrumbHome}
          alt={t(homeMenu?.text ?? 'home')}
          size="sm"
        />
      </Link>

      {links?.map((it, index) => {
        const last = index >= links.length - 1

        return (
          <div key={`breadcrumb-link-${index}`} className="flex flex-row max-w-lg">
            <div className="mx-4 mt-1">
              <DyoIcon className="aspect-square" src={breadcrumbNext} alt="" size="sm" />
            </div>

            {last ? (
              <DyoLabel className="my-auto truncate">{it.name}</DyoLabel>
            ) : (
              <Link key={`breadcrumb-link-${index}-link`} to={it.url}>
                <DyoLabel className="cursor-pointer my-auto" textColor="text-lens-turquoise">
                  {it.name}
                </DyoLabel>
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Breadcrumb
