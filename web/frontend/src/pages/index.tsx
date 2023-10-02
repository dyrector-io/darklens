import { ROUTE_NODES } from '@app/routes'
import { redirectTo, withContextAuthorization } from '@app/utils'
import { NextPageContext } from 'next'

// eslint-disable-next-line react/jsx-no-useless-fragment
const IndexPage = () => <></>

export default IndexPage

const getPageServerSideProps = async (_: NextPageContext) => redirectTo(ROUTE_NODES)

export const getServerSideProps = withContextAuthorization(getPageServerSideProps)
