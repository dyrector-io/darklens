import React from 'react'
import { DyoHeading } from 'src/elements/dyo-heading'
import backArrow from 'src/assets/back.svg'
import DyoIcon from 'src/elements/dyo-icon'
import { useNavigate } from 'react-router-dom'

export interface PageHeadingProps {
  title: string | React.ReactNode
  backTo?: string
}

const PageHeading = (props: React.PropsWithChildren<PageHeadingProps>) => {
  const { title, backTo, children } = props

  const nav = useNavigate()

  return (
    <div className="flex flex-row items-center mb-4 h-10">
      {backTo && <DyoIcon src={backArrow} alt="" size="lg" onClick={() => nav(backTo)} />}

      {!!backTo && !!title && <div className="bg-lens-surface-3 w-px h-8 mx-4" />}

      {typeof title === 'string' ? (
        <DyoHeading element="h2" className="flex-1 text-2xl text-lens-text-0">
          {title}
        </DyoHeading>
      ) : (
        <div className="flex-1">{title}</div>
      )}

      {children}
    </div>
  )
}

export default PageHeading
