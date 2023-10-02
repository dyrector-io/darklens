import { Layout } from '@app/components/layout'
import { BreadcrumbLink } from '@app/components/shared/breadcrumb'
import PageHeading from '@app/components/shared/page-heading'
import { ROUTE_DASHBOARD } from '@app/routes'
import { withContextAuthorization } from '@app/utils'
import { NextPageContext } from 'next'
import useTranslation from 'next-translate/useTranslation'

type DashboardPageProps = {}

const DashboardPage = (_: DashboardPageProps) => {
  const { t } = useTranslation('dashboard')

  const selfLink: BreadcrumbLink = {
    name: t('common:dashboard'),
    url: ROUTE_DASHBOARD,
  }

  return (
    <Layout title={t('common:dashboard')}>
      <PageHeading pageLink={selfLink} />
    </Layout>
  )
}

export default DashboardPage

const getPageServerSideProps = async (_: NextPageContext) => ({
  props: {},
})

export const getServerSideProps = withContextAuthorization(getPageServerSideProps)
