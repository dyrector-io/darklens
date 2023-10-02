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

const imports = [NodeModule, AgentModule, HealthModule, ConfigModule.forRoot(appConfig)]

if (process.env.NODE_ENV === 'production') {
  imports.push(LoggerModule.forRoot(pinoLoggerConfig))
}

@Module({
  imports,
  controllers: [],
  providers: [PrismaService, ShutdownService, UuidValidationGuard],
})
export default class AppModule {}
