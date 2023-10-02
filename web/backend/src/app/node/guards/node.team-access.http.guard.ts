import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import NodeService from '../node.service'

@Injectable()
export default class NodeTeamAccessGuard implements CanActivate {
  constructor(
    private readonly service: NodeService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const nodeId = req.params.nodeId as string

    if (!nodeId) {
      return true
    }

    return await this.service.checkNode(nodeId)
  }
}
