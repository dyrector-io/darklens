import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import React, { ForwardedRef, forwardRef } from 'react'
import DyoIcon from './dyo-icon'
import DyoMessage from './dyo-message'

export interface DyoSelectProps extends React.InputHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  grow?: boolean
  message?: string
  messageType?: 'error' | 'info'
}

export const DyoSelect = forwardRef((props: DyoSelectProps, ref: ForwardedRef<HTMLSelectElement>) => {
  const { message, messageType, grow, ...forwaredProps } = props

  const { t } = useTranslation('common')

  return (
    <>
      <div className={clsx(props.className, 'relative', grow ? null : 'w-80')}>
        <select
          {...forwaredProps}
          ref={ref}
          className={clsx(
            'w-full cursor-pointer appearance-none bg-lens-medium h-11 pl-4 p-2 ring-2 rounded-md focus:outline-none focus:lens-dark',
            props.disabled
              ? 'text-lens-bright-muted ring-lens-light-grey-muted'
              : 'text-lens-bright ring-lens-light-grey',
          )}
        />
        <div className="pointer-events-none pr-2 absolute h-[24px] right-0 top-1/2 transform -translate-y-1/2">
          <DyoIcon src="/chevron_down.svg" alt={t('common:down')} aria-hidden size="md" />
        </div>
      </div>

      {!message ? null : <DyoMessage message={message} messageType={messageType} />}
    </>
  )
})

DyoSelect.displayName = 'DyoSelect'
DyoSelect.defaultProps = {
  className: null,
  disabled: false,
  grow: false,
  message: null,
  messageType: 'error',
}
