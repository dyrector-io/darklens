import { Metadata } from '@grpc/grpc-js'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import PrismaService from 'src/services/prisma.service'
import GrpcNodeConnection, { NodeGrpcCall } from 'src/shared/grpc-node-connection'

@Injectable()
export default class AgentAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = context.getArgByIndex<Metadata>(1)
    const call = context.getArgByIndex<NodeGrpcCall>(2)

    const connection = new GrpcNodeConnection(metadata, call)
    if (!connection.verify(this.jwt)) {
      return false
    }

    const node = await this.prisma.node.findFirst({
      where: {
        id: connection.nodeId,
        tokenNonce: connection.tokenNonce,
      },
    })
    if (!node) {
      return false
    }

    return true
  }
}
