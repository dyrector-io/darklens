import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger'
import UuidParams from 'src/decorators/api-params.decorator'
import { CreatedResponse, CreatedWithLocation } from '../../interceptors/created-with-location.decorator'
import { Public } from '../auth/auth.guard'
import NodeTeamAccessGuard from './guards/node.team-access.http.guard'
import { NodeId, PARAM_NODE_ID, ROUTE_NODES, ROUTE_NODE_ID } from './node.const'
import {
  CreateNodeDto,
  NodeAuditLogListDto,
  NodeAuditLogQueryDto,
  NodeDetailsDto,
  NodeDto,
  NodeGenerateScriptDto,
  NodeInstallDto,
  UpdateNodeDto,
} from './node.dto'
import NodeService from './node.service'
import NodeGenerateScriptValidationPipe from './pipes/node.generate-script.pipe'
import NodeGetScriptValidationPipe from './pipes/node.get-script.pipe'

@Controller(`${ROUTE_NODES}`)
@ApiTags(ROUTE_NODES)
@UseGuards(NodeTeamAccessGuard)
export default class NodeHttpController {
  constructor(private service: NodeService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description:
      "Fetch data of deployment targets. Response should include an array with the node's `type`, `status`, `description`, `icon`, `address`, `connectedAt` date, `version`, `id`, and `name`.",
    summary: 'Get data of nodes that belong to your team.',
  })
  @ApiOkResponse({
    type: NodeDto,
    isArray: true,
    description: 'Data of nodes listed.',
  })
  @ApiForbiddenResponse({ description: 'Unauthorized request for nodes.' })
  async getNodes(): Promise<NodeDto[]> {
    return this.service.getNodes()
  }

  @Get(ROUTE_NODE_ID)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description:
      "Fetch data of a specific node. Request must include `nodeId` in body. Response should include an array with the node's `type`, `status`, `description`, `icon`, `address`, `connectedAt` date, `version`, `updatable`, `id`, `name`, `hasToken`, and agent installation details.",
    summary: 'Get data of nodes that belong to your team.',
  })
  @ApiOkResponse({ type: NodeDetailsDto, description: 'Data of the node.' })
  @ApiBadRequestResponse({ description: 'Bad request for node details.' })
  @ApiForbiddenResponse({ description: 'Unauthorized request for node details.' })
  @ApiNotFoundResponse({ description: 'Node not found.' })
  @UuidParams(PARAM_NODE_ID)
  async getNodeDetails(@NodeId() nodeId: string): Promise<NodeDetailsDto> {
    return this.service.getNodeDetails(nodeId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    description:
      "Request must include the node's `name` in body. Response should include an array with the node's `type`, `status`, `description`, `icon`, `address`, `connectedAt` date, `version`, `id`, and `name`.",
    summary: 'Create new node.',
  })
  @CreatedWithLocation()
  @ApiBody({ type: CreateNodeDto })
  @ApiCreatedResponse({ type: NodeDto, description: 'New node created.' })
  @ApiConflictResponse({ description: 'Node name taken.' })
  @ApiBadRequestResponse({ description: 'Bad request for node creation.' })
  @ApiForbiddenResponse({ description: 'Unauthorized request for node creation.' })
  async createNode(@Body() request: CreateNodeDto): Promise<CreatedResponse<NodeDto>> {
    const node = await this.service.createNode(request)

    return {
      url: `${ROUTE_NODES}/${node.id}`,
      body: node,
    }
  }

  @Put(ROUTE_NODE_ID)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    description: "Request must include the node's `name` in body, body can include `description` and `icon`.",
    summary: 'Update details of a node.',
  })
  @ApiNoContentResponse({ description: 'Node details modified.' })
  @ApiBadRequestResponse({ description: 'Bad request for node details.' })
  @ApiForbiddenResponse({ description: 'Unauthorized request for node details.' })
  @ApiNotFoundResponse({ description: 'Node not found.' })
  @ApiConflictResponse({ description: 'Node name taken.' })
  @UuidParams(PARAM_NODE_ID)
  async updateNode(@NodeId() id: string, @Body() request: UpdateNodeDto): Promise<void> {
    await this.service.updateNode(id, request)
  }

  @Delete(ROUTE_NODE_ID)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    description: "Request must include the node's `name` in body.",
    summary: 'Delete node.',
  })
  @ApiNoContentResponse({ description: 'Node deleted.' })
  @ApiForbiddenResponse({ description: 'Unauthorized request for node delete.' })
  @ApiNotFoundResponse({ description: 'Node not found.' })
  @UuidParams(PARAM_NODE_ID)
  async deleteNode(@NodeId() nodeId: string): Promise<void> {
    return this.service.deleteNode(nodeId)
  }

  @Post(`${ROUTE_NODE_ID}/script`)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    description: 'Request must include `nodeId`, `type`, and `scriptType` in URL.',
    summary: 'Create agent install script.',
  })
  @ApiOkResponse({ type: NodeInstallDto, description: 'Install script generated.' })
  @ApiBadRequestResponse({ description: 'Bad request for an install script.' })
  @ApiForbiddenResponse({ description: 'Unauthorized request for an install script.' })
  @UuidParams(PARAM_NODE_ID)
  async generateScript(
    @NodeId(NodeGenerateScriptValidationPipe) nodeId: string,
    @Body() request: NodeGenerateScriptDto,
  ): Promise<NodeInstallDto> {
    return await this.service.generateScript(nodeId, request)
  }

  @Delete(`${ROUTE_NODE_ID}/script`)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    description: "Request must include the node's `name` in body.",
    summary: 'Delete node set up install script.',
  })
  @ApiNoContentResponse({ description: 'Agent install script deleted.' })
  @ApiForbiddenResponse({ description: 'Unauthorized request for script delete.' })
  @ApiNotFoundResponse({ description: 'Install script not found.' })
  async discardScript(@NodeId() nodeId: string): Promise<void> {
    return await this.service.discardScript(nodeId)
  }

  @Public()
  @Get(`${ROUTE_NODE_ID}/script`)
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  @ApiOperation({
    description:
      "Request must include the node's `name` in body. Response should include `type`, `status`, `description`, `icon`, `address`, `connectedAt` date, `version`, `updatable`, `id`, `name`, `hasToken`, and `install` details.",
    summary: 'Fetch install script.',
  })
  @ApiOkResponse({ type: NodeDetailsDto, description: 'Install script.' })
  @ApiBadRequestResponse({ description: 'Bad request for an install script.' })
  @ApiForbiddenResponse({ description: 'Unauthorized request for an install script.' })
  @ApiNotFoundResponse({ description: 'Install script not found.' })
  @Header('content-type', 'text/plain')
  @UuidParams(PARAM_NODE_ID)
  async getScript(@NodeId(NodeGetScriptValidationPipe) nodeId: string): Promise<string> {
    return await this.service.getScript(nodeId)
  }

  @Delete(`${ROUTE_NODE_ID}/token`)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    description: "Request must include the node's `name` in body.",
    summary: "Revoke the node's access token.",
  })
  @ApiNoContentResponse({ description: 'Token revoked.' })
  @ApiForbiddenResponse({ description: 'Unauthorized request for a token.' })
  @ApiNotFoundResponse({ description: 'Token not found.' })
  @UuidParams(PARAM_NODE_ID)
  async revokeToken(@NodeId() nodeId: string): Promise<void> {
    return await this.service.revokeToken(nodeId)
  }

  @Get(`${ROUTE_NODE_ID}/audit`)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description:
      'Request must include `skip`, `take`, and dates of `from` and `to` in the body. Response should include an array of `items`: `createdAt` date, `event`, and `data`.',
    summary: 'Fetch audit log.',
  })
  @ApiOkResponse({ type: NodeAuditLogListDto, description: 'Paginated list of the audit log.' })
  @ApiBadRequestResponse({ description: 'Bad request for audit log.' })
  @ApiForbiddenResponse({ description: 'Unauthorized request for audit log.' })
  @ApiNotFoundResponse({ description: 'Audit log not found.' })
  async getAuditLog(@NodeId() nodeId: string, @Query() query: NodeAuditLogQueryDto): Promise<NodeAuditLogListDto> {
    return await this.service.getAuditLog(nodeId, query)
  }
}
