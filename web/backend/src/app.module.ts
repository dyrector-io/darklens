import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import AgentModule from './app/agent/agent.module'
import HealthModule from './app/health/health.module'
import NodeModule from './app/node/node.module'
import appConfig from './config/app.config'
import pinoLoggerConfig from './config/pino.logger.config'
import UuidValidationGuard from './guards/uuid-params.validation.guard'
import ShutdownService from './services/application.shutdown.service'
import PrismaService from './services/prisma.service'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path';

const staticFileHost = ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'assets', 'frontend'),
  exclude: ['/api/(.*)'],
})

const imports = [NodeModule, AgentModule, HealthModule, ConfigModule.forRoot(appConfig), staticFileHost]

if (process.env.NODE_ENV === 'production') {
  imports.push(LoggerModule.forRoot(pinoLoggerConfig))
}

@Module({
  imports,
  controllers: [],
  providers: [PrismaService, ShutdownService, UuidValidationGuard],
})
export default class AppModule {}
