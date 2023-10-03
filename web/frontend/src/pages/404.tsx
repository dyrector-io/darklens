import { SingleFormLayout } from 'src/components/layout'
import DyoButton from 'src/elements/dyo-button'
import { DyoHeading } from 'src/elements/dyo-heading'
import { ROUTE_INDEX } from 'src/routes'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const Page404 = () => {
  const { t } = useTranslation('404')
  const nav = useNavigate()

  const navigateToIndex = async () => await nav(ROUTE_INDEX)

  return (
    <SingleFormLayout title={t('oops')}>
      <div className="flex flex-row bg-lens-dark">
        <div className="flex flex-col items-center w-full my-auto">
          <div>
            <img src="/404.svg" alt={t('errors:notFound')} width={500} height={346.833} />
          </div>

          <DyoHeading element="h2" className="text-4xl text-white font-extrabold mt-16">
            {t('oops')}
          </DyoHeading>

          <p className="text-center text-lens-light font-semibold my-6">{t('nothingYet')}</p>

          <DyoButton className="px-12" outlined onClick={navigateToIndex}>
            {t('common:back')}
          </DyoButton>
        </div>
      </div>
    </SingleFormLayout>
  )
}

export default Page404
