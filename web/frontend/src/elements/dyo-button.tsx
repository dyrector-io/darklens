import clsx from 'clsx'
import React from 'react'
import { Link } from 'react-router-dom'

export interface DyoButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
  heightClassName?: string
  secondary?: boolean
  outlined?: boolean
  underlined?: boolean
  thin?: boolean
  text?: boolean
  color?: string
  textColor?: string
  href?: string
  danger?: boolean
}

const DyoButton = (props: DyoButtonProps) => {
  const {
    secondary,
    outlined,
    underlined,
    text,
    thin,
    className,
    heightClassName,
    color: colorClassName,
    textColor: textColorClassName,
    href,
    disabled,
    children,
    type,
    danger,
    ...forwaredProps
  } = props

  const defaultColor = danger
    ? outlined
      ? 'ring-lens-error-red'
      : 'bg-lens-error-red'
    : secondary
    ? outlined
      ? 'ring-lens-warning-orange'
      : 'bg-lens-warning-orange'
    : outlined
    ? 'ring-lens-turquoise'
    : 'bg-lens-turquoise'
  const disabledColor = outlined ? 'ring-lens-surface-3' : 'bg-lens-surface-3'

  const color = text ? 'bg-transparent' : disabled ? disabledColor : colorClassName ?? defaultColor

  const defaultTextColor =
    text || outlined ? (secondary ? 'text-lens-warning-orange' : 'text-lens-turquoise') : 'text-white'

  const textColor = disabled ? 'text-lens-text-2' : textColorClassName ?? defaultTextColor

  const ring = outlined && !text ? 'ring-2' : null
  const border = underlined ? 'border-b-2 border-lens-turquoise' : null
  const rounded = !underlined ? 'rounded' : null
  const font = !thin && (text || !outlined) ? 'font-semibold' : null
  const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer'

  const button = (
    <button
      {...forwaredProps}
      disabled={disabled}
      /* eslint-disable-next-line react/button-has-type */
      type={type ?? 'button'}
      className={clsx(
        className ?? 'mx-2 px-10',
        ring,
        border,
        color,
        textColor,
        font,
        rounded,
        cursor,
        heightClassName ?? 'h-10',
      )}
    >
      {children}
    </button>
  )

  return href ? (
    <Link className="inline-block" to={href}>
      {button}
    </Link>
  ) : (
    button
  )
}

export default DyoButton
