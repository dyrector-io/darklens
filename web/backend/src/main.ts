import { ServerCredentials } from '@grpc/grpc-js'
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { SwaggerModule } from '@nestjs/swagger'
import { Logger as PinoLogger } from 'nestjs-pino'
import { join } from 'path'
import AppModule from './app.module'
import createSwaggerConfig from './config/swagger.config'
import HttpExceptionFilter from './filters/http.exception-filter'
import UuidValidationGuard from './guards/uuid-params.validation.guard'
import CreatedWithLocationInterceptor from './interceptors/created-with-location.interceptor'
import HttpLoggerInterceptor from './interceptors/http.logger.interceptor'
import PrismaErrorInterceptor from './interceptors/prisma-error-interceptor'
import { PRODUCTION } from './shared/const'
import DyoWsAdapter from './websockets/dyo.ws.adapter'

const HOUR_IN_MS: number = 60 * 60 * 1000

type GrpcOptions = {
  url: string
  credentials: ServerCredentials
}

const loadGrpcOptions = (portEnv: string): GrpcOptions => {
  const port = portEnv ? Number(portEnv) : 5000

  return {
    // tls termination occurs at the reverse proxy
    credentials: ServerCredentials.createInsecure(),
    url: `0.0.0.0:${port}`,
  }
}

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // Using Nestjs Logger Service for default logging
    logger: new Logger(),
  })

  const configService = app.get(ConfigService)
  app.setGlobalPrefix('/api')
  app.enableShutdownHooks()

  // If it's in production, we inject the PinoLogger Logger Service instead of the default one
  // because we need to log in JSON format to stdout
  if (configService.get<string>('NODE_ENV') === PRODUCTION) {
    app.useLogger(app.get(PinoLogger))
  }

  // Swagger
  const config = createSwaggerConfig(configService)
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('/api/swagger', app, document)

  const agentOptions = loadGrpcOptions(configService.get<string>('GRPC_AGENT_PORT'))
  const httpOptions = configService.get<string>('HTTP_API_PORT', '8000')

  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalGuards(app.get(UuidValidationGuard))
  app.useGlobalInterceptors(
    new HttpLoggerInterceptor(),
    app.get(PrismaErrorInterceptor),
    new CreatedWithLocationInterceptor(),
  )
  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  app.useWebSocketAdapter(new DyoWsAdapter(app))

  // agent
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['agent'],
      protoPath: [join(__dirname, '../proto/agent.proto'), join(__dirname, '../proto/common.proto')],
      keepalive: { keepaliveTimeoutMs: HOUR_IN_MS },
      ...agentOptions,
    },
  })

  await app.startAllMicroservices()
  await app.listen(httpOptions)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
