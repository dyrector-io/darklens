import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import PrismaService from 'src/services/prisma.service'
import AgentModule from '../agent/agent.module'
import NodeContainerWebSocketGateway from './node.container.ws.gateway'
import NodeGlobalContainerHttpController from './node.global-container.http.controller'
import NodeHttpController from './node.http.controller'
import NodeMapper from './node.mapper'
import NodePrefixContainerHttpController from './node.prefix-container.http.controller'
import NodeService from './node.service'
import NodeWebSocketGateway from './node.ws.gateway'

@Module({
  imports: [AgentModule, HttpModule],
  exports: [NodeMapper],
  controllers: [NodeHttpController, NodePrefixContainerHttpController, NodeGlobalContainerHttpController],
  providers: [PrismaService, NodeService, NodeMapper, NodeWebSocketGateway, NodeContainerWebSocketGateway],
})
export default class NodeModule {}
