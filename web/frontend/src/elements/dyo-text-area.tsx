import clsx from 'clsx'
import React from 'react'
import { DyoLabel } from './dyo-label'
import DyoMessage from './dyo-message'

export interface DyoTextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'ref'> {
  grow?: boolean
  label?: string
  message?: string
  messageType?: 'error' | 'info'
  invalid?: boolean
}

const DyoTextArea = (props: DyoTextAreaProps) => {
  const { label, message, messageType, grow, name, className, children, id, invalid, ...forwardedProps } = props

  const error = (message && messageType === 'error') || invalid

  return (
    <>
      {!label ? null : (
        <DyoLabel className="mt-8 mb-2.5" htmlFor={id ?? name}>
          {label}
        </DyoLabel>
      )}

      <textarea
        {...forwardedProps}
        name={name}
        id={id ?? name}
        className={clsx(
          className,
          'bg-lens-surface-6 p-4 ring-2 rounded-md focus:outline-none focus:lens-dark',
          grow ? null : 'w-80',
          error ? 'text-lens-text-0 ring-lens-error-red' : 'text-lens-text-0 ring-lens-surface-4',
        )}
      >
        {children}
      </textarea>

      {!message ? null : <DyoMessage message={message} messageType={messageType} />}
    </>
  )
}

export default DyoTextArea

DyoTextArea.displayName = 'DyoTextArea'
DyoTextArea.defaultProps = {
  grow: false,
  label: null,
  message: null,
  messageType: 'error',
  invalid: false,
}
