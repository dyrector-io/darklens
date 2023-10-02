import { DyoHeading } from '@app/elements/dyo-heading'
import DyoIcon from '@app/elements/dyo-icon'
import { DyoLabel } from '@app/elements/dyo-label'
import { ROUTE_INDEX } from '@app/routes'
import useTranslation from 'next-translate/useTranslation'
import Link from 'next/link'
import { sidebarSections } from '../main/sidebar'

export type BreadcrumbLink = {
  name: string
  url: string
}

export interface BreadcrumbProps {
  page: string
  pageUrl: string
  links?: BreadcrumbLink[]
}

const Breadcrumb = (props: BreadcrumbProps) => {
  const { page, pageUrl, links } = props

  const { t } = useTranslation('common')

  const homeMenu = sidebarSections.find(it => it.link === pageUrl)

  return (
    <div key="breadcrumb" className="flex flex-row items-center w-1/2 flex-grow">
      <DyoHeading element="h2" className="text-2xl text-lens-bright">
        {page}
      </DyoHeading>

      <div className="bg-lens-bright w-px h-8 mx-6" />

      <Link href={homeMenu?.link ?? ROUTE_INDEX} passHref>
        <DyoIcon
          className="cursor-pointer"
          src={homeMenu?.icon ?? '/breadcrumb_home.svg'}
          alt={t(homeMenu?.text ?? 'home')}
          size="sm"
        />
      </Link>

      {links?.map((it, index) => {
        const last = index >= links.length - 1

        return (
          <div key={`breadcrumb-link-${index}`} className="flex flex-row max-w-lg">
            <div className="mx-4 mt-1">
              <DyoIcon className="aspect-square" src="/breadcrumb_next.svg" alt="" size="sm" />
            </div>

            {last ? (
              <DyoLabel className="my-auto truncate">{it.name}</DyoLabel>
            ) : (
              <Link key={`breadcrumb-link-${index}-link`} href={it.url} passHref>
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
