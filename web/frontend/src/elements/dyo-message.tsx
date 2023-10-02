import clsx from 'clsx'

interface DyoMessageProps {
  message?: string
  messageType?: 'error' | 'info'
  className?: string
  marginClassName?: string
}

const DyoMessage = (props: DyoMessageProps) => {
  const { message, messageType, className, marginClassName } = props

  return !message ? null : (
    <p
      suppressHydrationWarning
      className={clsx(
        className ?? 'text-xs italic w-80',
        !messageType
          ? 'text-lens-error-red'
          : messageType === 'error'
          ? 'text-lens-error-red'
          : 'text-lens-warning-orange',
        marginClassName ?? 'mt-1',
      )}
    >
      {message}
    </p>
  )
}

export default DyoMessage
