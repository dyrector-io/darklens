import { useTranslation } from 'react-i18next'
import { useNavigate, useRouteError } from 'react-router-dom'
import { SingleFormLayout } from 'src/components/layout'
import DyoButton from 'src/elements/dyo-button'
import { DyoHeading } from 'src/elements/dyo-heading'
import { ROUTE_INDEX, ROUTE_STATUS } from 'src/routes'

const Page500 = () => {
  const { t } = useTranslation('status')
  const nav = useNavigate()
  const error = useRouteError()
  console.error(error)

  const navigateToIndex = async () => await nav(ROUTE_INDEX)

  return (
    <SingleFormLayout title={t('errors:internalError')}>
      <DyoHeading element="h2" className="self-center text-lg lg:text-2xl text-white font-extrabold mt-auto">
        {t('errors:internalError')}
      </DyoHeading>

      <div className="flex flex-row mb-auto mt-12">
        <DyoButton className="px-12" outlined onClick={navigateToIndex}>
          {t('common:back')}
        </DyoButton>

        <DyoButton className="ml-2 mr-auto px-12" href={ROUTE_STATUS}>
          {t('common:status')}
        </DyoButton>
      </div>
    </SingleFormLayout>
  )
}

export default Page500
