import clsx from 'clsx'
import React from 'react'
import { Link } from 'react-router-dom'

export interface DyoHeadingProps {
  element?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
  children: React.ReactNode
  onClick?: () => void
  href?: string
}

export const DyoHeading = (props: DyoHeadingProps) => {
  const { element, className, children, onClick, href } = props

  return React.createElement(
    element ?? 'h1',
    {
      className: clsx(className ?? 'text-lens-bright font-extrabold text-4xl', onClick ? 'cursor-pointer' : null),
      onClick,
    },
    href ? <Link to={href}>{children}</Link> : children,
  )
}
