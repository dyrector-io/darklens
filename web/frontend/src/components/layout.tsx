import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import Head from 'next/head'
import React from 'react'
import Footer from './main/footer'
import { Sidebar } from './main/sidebar'

const sidebarWidth = 'w-[17rem]'
const mainWidth = 'w-[calc(100vw-17rem)]' // ViewWidth - sidebar

interface PageHeadProps {
  title: string
}

const PageHead = (props: PageHeadProps) => {
  const { title } = props

  const { t } = useTranslation('head')

  return (
    <Head>
      <title>{t('title', { page: title })}</title>
    </Head>
  )
}

export interface LayoutProps {
  title: string
  // TODO(@m8vago): check after eslint update if this is still necessary
  // eslint-disable-next-line react/no-unused-prop-types
  children: React.ReactNode
}

export const Layout = (props: LayoutProps) => {
  const { title, children } = props

  return (
    <>
      <PageHead title={title} />

      <main className="flex flex-row h-full bg-lens-dark w-full">
        <Sidebar className={clsx('flex flex-col bg-lens-medium h-screen sticky top-0', sidebarWidth)} />

        <div className={clsx('flex flex-col px-7 pt-4', mainWidth)}>
          <div className="flex flex-col h-full">{children}</div>

          <Footer className="mt-auto" />
        </div>
      </main>
    </>
  )
}

export const SingleFormLayout = (props: LayoutProps) => {
  const { title, children } = props

  return (
    <>
      <PageHead title={title} />

      <main className="flex flex-col w-screen h-screen bg-lens-dark">
        <div className="flex flex-col h-full justify-center items-center">{children}</div>

        <Footer className="mx-7" />
      </main>
    </>
  )
}
