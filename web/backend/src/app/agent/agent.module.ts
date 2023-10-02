import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { AppJwtModule } from 'src/config/jwt.config'
import PrismaService from 'src/services/prisma.service'
import { AGENT_STRATEGY_TYPES } from './agent.connection-strategy.provider'
import AgentController from './agent.grpc.controller'
import AgentService from './agent.service'

@Module({
  imports: [HttpModule, AppJwtModule],
  exports: [AgentService],
  controllers: [AgentController],
  providers: [AgentService, PrismaService, ...AGENT_STRATEGY_TYPES],
})
export default class AgentModule {}
