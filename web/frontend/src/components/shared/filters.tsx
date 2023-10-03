import { DyoCard } from 'src/elements/dyo-card'
import { DyoHeading } from 'src/elements/dyo-heading'
import { DyoInput } from 'src/elements/dyo-input'
import clsx from 'clsx'
import React from 'react'
import { useTranslation } from 'react-i18next'

export interface FiltersProps {
  setTextFilter: (filter: string) => void
  children?: React.ReactNode
  searchClassName?: string
}

const Filters = (props: FiltersProps) => {
  const { setTextFilter: setFilter, children, searchClassName } = props

  const { t } = useTranslation('common')

  return (
    <DyoCard className="flex flex-col p-6">
      <DyoHeading element="h3" className="text-xl text-lens-bright">
        {t('common:filters')}
      </DyoHeading>

      <div className="flex items-center mt-4">
        <DyoInput
          className={clsx(searchClassName ?? 'grow')}
          placeholder={t('common:search')}
          onChange={e => setFilter(e.target.value)}
          grow
        />

        {children}
      </div>
    </DyoCard>
  )
}

export default Filters
