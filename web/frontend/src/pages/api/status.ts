import { DyoServiceInfo } from '@app/models'
import { useErrorMiddleware } from '@server/error-middleware'
import { withMiddlewares } from '@server/middlewares'
import packageInfo from '@server/package'
import serviceStatus from '@server/service-status'
import { NextApiRequest, NextApiResponse } from 'next'

const onGet = async (_: NextApiRequest, res: NextApiResponse) => {
  const backend = await serviceStatus.backend.info()

  const dto: DyoServiceInfo = {
    backend,
    database: {
      status: backend.lastMigration ? 'operational' : 'unavailable',
      version: backend.lastMigration ? backend.lastMigration.split('_', 1)[0] : null,
    },
    app: {
      status: backend.status,
      version: packageInfo.version,
    },
  }

  res.status(200).json(dto)
}

export default withMiddlewares(
  {
    onGet,
  },
  [useErrorMiddleware],
  false,
)
