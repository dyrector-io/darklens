import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsIn, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator'
import { PaginatedList, PaginationQuery } from 'src/shared/dtos/paginating'

export const NODE_SCRIPT_TYPE_VALUES = ['shell', 'powershell'] as const
export type NodeScriptTypeDto = (typeof NODE_SCRIPT_TYPE_VALUES)[number]

export const NODE_CONNECTION_STATUS_VALUES = ['unreachable', 'connected', 'outdated', 'updating'] as const
export type NodeConnectionStatus = (typeof NODE_CONNECTION_STATUS_VALUES)[number]

export const NODE_EVENT_TYPE_VALUES = ['installed', 'connected', 'left', 'kicked', 'containerCommand'] as const
export type NodeEventTypeEnum = (typeof NODE_EVENT_TYPE_VALUES)[number]

export const CONTAINER_STATE_VALUES = ['running', 'waiting', 'exited'] as const
export type ContainerState = (typeof CONTAINER_STATE_VALUES)[number]

export class BasicNodeDto {
  @IsUUID()
  id: string

  @IsString()
  name: string
}

export class BasicNodeWithStatus extends BasicNodeDto {
  @IsString()
  @IsIn(NODE_CONNECTION_STATUS_VALUES)
  @ApiProperty({
    enum: NODE_CONNECTION_STATUS_VALUES,
  })
  @IsOptional()
  status?: NodeConnectionStatus
}

export class NodeDto extends BasicNodeDto {
  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  icon?: string

  @IsString()
  @IsOptional()
  address?: string

  @IsString()
  @IsIn(NODE_CONNECTION_STATUS_VALUES)
  @ApiProperty({
    enum: NODE_CONNECTION_STATUS_VALUES,
  })
  @IsOptional()
  status?: NodeConnectionStatus

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  connectedAt?: Date

  @IsString()
  @IsOptional()
  version?: string
}

export class NodeInstallDto {
  @IsString()
  command: string

  @IsString()
  script: string

  @IsDate()
  @Type(() => Date)
  expireAt: Date
}

export class NodeDetailsDto extends NodeDto {
  @IsBoolean()
  hasToken: boolean

  @IsOptional()
  @ValidateNested()
  install?: NodeInstallDto

  @IsBoolean()
  @IsOptional()
  updatable?: boolean
}

export class CreateNodeDto {
  @IsString()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  icon?: string
}

export class UpdateNodeDto extends CreateNodeDto {}

export class NodeGenerateScriptDto {
  @IsString()
  @IsIn(NODE_SCRIPT_TYPE_VALUES)
  @ApiProperty({
    enum: NODE_SCRIPT_TYPE_VALUES,
  })
  scriptType: NodeScriptTypeDto

  @IsString()
  @IsOptional()
  hostAddress?: string
}

export type ContainerOperationDto = 'start' | 'stop' | 'restart'

export class NodeContainerCommandDto {
  @ValidateNested()
  container: string

  @ValidateNested()
  operation: ContainerOperationDto
}

export class NodeDeleteContainerDto {
  @IsObject()
  @IsOptional()
  @ValidateNested()
  container?: string

  @IsString()
  @IsOptional()
  prefix?: string
}

export class ContainerPort {
  internal: number

  external: number
}

export class ContainerDto {
  name: string

  command: string

  @Type(() => Date)
  @IsDate()
  createdAt: Date

  @ApiProperty({ enum: CONTAINER_STATE_VALUES })
  @IsIn(CONTAINER_STATE_VALUES)
  state: ContainerState

  // kubernetes reason (like crashloop backoff) or docker state
  reason: string

  imageName: string

  imageTag: string

  ports: ContainerPort[]
}

export class NodeAuditLogQueryDto extends PaginationQuery {
  @Type(() => Date)
  @IsDate()
  readonly from: Date

  @Type(() => Date)
  @IsDate()
  readonly to: Date

  @IsString()
  @IsIn(NODE_EVENT_TYPE_VALUES)
  @IsOptional()
  readonly filterEventType?: NodeEventTypeEnum
}

export class NodeAuditLogDto {
  @Type(() => Date)
  @IsDate()
  createdAt: Date

  @IsString()
  event: string

  @IsOptional()
  data?: object
}

export class NodeAuditLogListDto extends PaginatedList<NodeAuditLogDto> {
  @Type(() => NodeAuditLogDto)
  items: NodeAuditLogDto[]

  total: number
}

export class ContainerInspectionDto {
  @IsString()
  inspection: string
}
