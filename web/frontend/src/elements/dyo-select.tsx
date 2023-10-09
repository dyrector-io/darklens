import clsx from 'clsx'
import React, { ForwardedRef, forwardRef } from 'react'
import DyoIcon from './dyo-icon'
import DyoMessage from './dyo-message'
import { useTranslation } from 'react-i18next'
import chevronDown from 'src/assets/chevron_down.svg'

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
            'w-full cursor-pointer appearance-none bg-lens-surface-6 h-11 pl-4 p-2 ring-2 rounded-md focus:outline-none focus:lens-dark',
            props.disabled ? 'text-lens-text-3 ring-lens-surface-4' : 'text-lens-text-0 ring-lens-surface-4',
          )}
        />
        <div className="pointer-events-none pr-2 absolute h-[24px] right-0 top-1/2 transform -translate-y-1/2">
          <DyoIcon src={chevronDown} alt={t('common:down')} aria-hidden size="md" />
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
