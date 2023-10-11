import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import PrismaService from 'src/services/prisma.service'
import AgentController from './agent.grpc.controller'
import AgentService from './agent.service'

export const AgentJwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET'),
    signOptions: { issuer: configService.get('AGENT_ADDRESS') },
  }),
})

@Module({
  imports: [HttpModule, AgentJwtModule],
  exports: [AgentService],
  controllers: [AgentController],
  providers: [AgentService, PrismaService],
})
export default class AgentModule {}
