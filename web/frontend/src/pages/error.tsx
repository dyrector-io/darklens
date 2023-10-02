import { ROUTE_INDEX } from '@app/routes'
import { redirectTo, withContextErrorHandling } from '@app/utils'
import { NextPageContext } from 'next'

// eslint-disable-next-line react/jsx-no-useless-fragment
const ErrorPage = () => <></>

export default ErrorPage

const getPageServerSideProps = async (_: NextPageContext) => redirectTo(ROUTE_INDEX)

export const getServerSideProps = withContextErrorHandling(getPageServerSideProps)
