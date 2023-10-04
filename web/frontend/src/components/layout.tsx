import React, { useEffect } from 'react'
import Footer from './main/footer'
import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router-dom'
import { ROUTE_INDEX } from 'src/routes'
import DyoIcon from 'src/elements/dyo-icon'
import logo from 'src/assets/darklens_logo.svg'
import user from 'src/assets/user.svg'
import logout from 'src/assets/logout.svg'
import cog from 'src/assets/cog.svg'

interface PageProps {
  title: string
  // TODO(@robot9706): figure out false positive lint error
  // eslint-disable-next-line react/no-unused-prop-types
  className?: string
}

export const Page = (props: React.PropsWithChildren<PageProps>) => {
  const { title, className, children } = props

  const { t } = useTranslation('common')

  useEffect(() => {
    document.title = t('title', { page: title })
  }, [title])

  return <div className={className ?? 'flex-1'}>{children}</div>
}

export const SingleFormLayout = (props: React.PropsWithChildren<PageProps>) => {
  const { title, children } = props

  const { t } = useTranslation('common')

  useEffect(() => {
    document.title = t('title', { page: title })
  }, [title])

  return (
    <main className="flex flex-col w-screen h-screen bg-lens-dark">
      <div className="flex flex-col h-full justify-center items-center">{children}</div>

      <Footer className="mx-7" />
    </main>
  )
}

export const MainLayout = () => {
  const { t } = useTranslation()

  return (
    <main className="w-full h-full">
      <div className="bg-lens-medium h-18 shadow-topbar fixed left-0 top-0 right-0 flex flex-row pr-7 z-50">
        <Link to={ROUTE_INDEX}>
          <div className="px-12 bg-lens-medium-eased">
            <img className="cursor-pointer" src={logo} alt={t('logoAlt')} width={120} height={20} />
          </div>
        </Link>

        <div className="flex-1 flex flex-row justify-end items-center">
          <DyoIcon src={cog} alt="" size="lg" className="mr-2 cursor-pointer" />

          <DyoIcon src={user} alt="" size="lg" className="cursor-pointer" />

          <div className="bg-lens-bright-muted w-px h-8 mx-3" />

          <DyoIcon src={logout} alt="" size="lg" className="cursor-pointer" />
        </div>
      </div>

      <div className="px-7 pt-20 h-full flex flex-col">
        <Outlet />

        <Footer className="flex-none mt-auto" />
      </div>
    </main>
  )
}
