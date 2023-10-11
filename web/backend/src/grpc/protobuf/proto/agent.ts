/* eslint-disable */
import { Metadata } from '@grpc/grpc-js'
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices'
import { Observable } from 'rxjs'
import { Timestamp } from '../../google/protobuf/timestamp'

export const protobufPackage = 'agent'

export enum CloseReason {
  CLOSE_REASON_UNSPECIFIED = 0,
  CLOSE = 1,
  SELF_DESTRUCT = 2,
  SHUTDOWN = 3,
  UNRECOGNIZED = -1,
}

export function closeReasonFromJSON(object: any): CloseReason {
  switch (object) {
    case 0:
    case 'CLOSE_REASON_UNSPECIFIED':
      return CloseReason.CLOSE_REASON_UNSPECIFIED
    case 1:
    case 'CLOSE':
      return CloseReason.CLOSE
    case 2:
    case 'SELF_DESTRUCT':
      return CloseReason.SELF_DESTRUCT
    case 3:
    case 'SHUTDOWN':
      return CloseReason.SHUTDOWN
    case -1:
    case 'UNRECOGNIZED':
    default:
      return CloseReason.UNRECOGNIZED
  }
}

export function closeReasonToJSON(object: CloseReason): string {
  switch (object) {
    case CloseReason.CLOSE_REASON_UNSPECIFIED:
      return 'CLOSE_REASON_UNSPECIFIED'
    case CloseReason.CLOSE:
      return 'CLOSE'
    case CloseReason.SELF_DESTRUCT:
      return 'SELF_DESTRUCT'
    case CloseReason.SHUTDOWN:
      return 'SHUTDOWN'
    case CloseReason.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED'
  }
}

export enum ContainerOperation {
  CONTAINER_OPERATION_UNSPECIFIED = 0,
  START_CONTAINER = 1,
  STOP_CONTAINER = 2,
  RESTART_CONTAINER = 3,
  UNRECOGNIZED = -1,
}

export function containerOperationFromJSON(object: any): ContainerOperation {
  switch (object) {
    case 0:
    case 'CONTAINER_OPERATION_UNSPECIFIED':
      return ContainerOperation.CONTAINER_OPERATION_UNSPECIFIED
    case 1:
    case 'START_CONTAINER':
      return ContainerOperation.START_CONTAINER
    case 2:
    case 'STOP_CONTAINER':
      return ContainerOperation.STOP_CONTAINER
    case 3:
    case 'RESTART_CONTAINER':
      return ContainerOperation.RESTART_CONTAINER
    case -1:
    case 'UNRECOGNIZED':
    default:
      return ContainerOperation.UNRECOGNIZED
  }
}

export function containerOperationToJSON(object: ContainerOperation): string {
  switch (object) {
    case ContainerOperation.CONTAINER_OPERATION_UNSPECIFIED:
      return 'CONTAINER_OPERATION_UNSPECIFIED'
    case ContainerOperation.START_CONTAINER:
      return 'START_CONTAINER'
    case ContainerOperation.STOP_CONTAINER:
      return 'STOP_CONTAINER'
    case ContainerOperation.RESTART_CONTAINER:
      return 'RESTART_CONTAINER'
    case ContainerOperation.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED'
  }
}

export enum ContainerState {
  CONTAINER_STATE_UNSPECIFIED = 0,
  RUNNING = 1,
  WAITING = 2,
  EXITED = 3,
  REMOVED = 4,
  UNRECOGNIZED = -1,
}

export function containerStateFromJSON(object: any): ContainerState {
  switch (object) {
    case 0:
    case 'CONTAINER_STATE_UNSPECIFIED':
      return ContainerState.CONTAINER_STATE_UNSPECIFIED
    case 1:
    case 'RUNNING':
      return ContainerState.RUNNING
    case 2:
    case 'WAITING':
      return ContainerState.WAITING
    case 3:
    case 'EXITED':
      return ContainerState.EXITED
    case 4:
    case 'REMOVED':
      return ContainerState.REMOVED
    case -1:
    case 'UNRECOGNIZED':
    default:
      return ContainerState.UNRECOGNIZED
  }
}

export function containerStateToJSON(object: ContainerState): string {
  switch (object) {
    case ContainerState.CONTAINER_STATE_UNSPECIFIED:
      return 'CONTAINER_STATE_UNSPECIFIED'
    case ContainerState.RUNNING:
      return 'RUNNING'
    case ContainerState.WAITING:
      return 'WAITING'
    case ContainerState.EXITED:
      return 'EXITED'
    case ContainerState.REMOVED:
      return 'REMOVED'
    case ContainerState.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED'
  }
}

/** Common */
export interface Empty {}

/** Agent commands */
export interface AgentInfo {
  id: string
  version: string
}

export interface AgentCommand {
  containerState?: ContainerStateRequest | undefined
  close?: CloseConnectionRequest | undefined
  containerCommand?: ContainerCommandRequest | undefined
  containerDelete?: ContainerDeleteRequest | undefined
  containerLog?: ContainerLogRequest | undefined
  containerInspect?: ContainerInspectRequest | undefined
}

export interface ContainerStateRequest {
  oneShot?: boolean | undefined
}

export interface CloseConnectionRequest {
  reason: CloseReason
}

export interface ContainerCommandRequest {
  name: string
  operation: ContainerOperation
}

export interface ContainerDeleteRequest {
  name: string
}

export interface ContainerLogRequest {
  name: string
  streaming: boolean
  tail: number
}

export interface ContainerInspectRequest {
  name: string
}

export interface ContainerStateItemPort {
  internal: number
  external: number
}

export interface ContainerStateItem {
  name: string
  command: string
  createdAt: Timestamp | undefined
  /** The 'State' of the container (Created, Running, etc) */
  state: ContainerState
  /** The 'reason' behind 'state'. */
  reason: string
  imageName: string
  imageTag: string
  ports: ContainerStateItemPort[]
}

export interface ContainerStateListMessage {
  data: ContainerStateItem[]
}

/** Container log */
export interface ContainerLogMessage {
  log: string
}

/** Container inspect */
export interface ContainerInspectMessage {
  name: string
  inspection: string
}

export const AGENT_PACKAGE_NAME = 'agent'

function createBaseEmpty(): Empty {
  return {}
}

export const Empty = {
  fromJSON(_: any): Empty {
    return {}
  },

  toJSON(_: Empty): unknown {
    const obj: any = {}
    return obj
  },
}

function createBaseAgentInfo(): AgentInfo {
  return { id: '', version: '' }
}

export const AgentInfo = {
  fromJSON(object: any): AgentInfo {
    return {
      id: isSet(object.id) ? String(object.id) : '',
      version: isSet(object.version) ? String(object.version) : '',
    }
  },

  toJSON(message: AgentInfo): unknown {
    const obj: any = {}
    message.id !== undefined && (obj.id = message.id)
    message.version !== undefined && (obj.version = message.version)
    return obj
  },
}

function createBaseAgentCommand(): AgentCommand {
  return {}
}

export const AgentCommand = {
  fromJSON(object: any): AgentCommand {
    return {
      containerState: isSet(object.containerState) ? ContainerStateRequest.fromJSON(object.containerState) : undefined,
      close: isSet(object.close) ? CloseConnectionRequest.fromJSON(object.close) : undefined,
      containerCommand: isSet(object.containerCommand)
        ? ContainerCommandRequest.fromJSON(object.containerCommand)
        : undefined,
      containerDelete: isSet(object.containerDelete)
        ? ContainerDeleteRequest.fromJSON(object.containerDelete)
        : undefined,
      containerLog: isSet(object.containerLog) ? ContainerLogRequest.fromJSON(object.containerLog) : undefined,
      containerInspect: isSet(object.containerInspect)
        ? ContainerInspectRequest.fromJSON(object.containerInspect)
        : undefined,
    }
  },

  toJSON(message: AgentCommand): unknown {
    const obj: any = {}
    message.containerState !== undefined &&
      (obj.containerState = message.containerState ? ContainerStateRequest.toJSON(message.containerState) : undefined)
    message.close !== undefined &&
      (obj.close = message.close ? CloseConnectionRequest.toJSON(message.close) : undefined)
    message.containerCommand !== undefined &&
      (obj.containerCommand = message.containerCommand
        ? ContainerCommandRequest.toJSON(message.containerCommand)
        : undefined)
    message.containerDelete !== undefined &&
      (obj.containerDelete = message.containerDelete
        ? ContainerDeleteRequest.toJSON(message.containerDelete)
        : undefined)
    message.containerLog !== undefined &&
      (obj.containerLog = message.containerLog ? ContainerLogRequest.toJSON(message.containerLog) : undefined)
    message.containerInspect !== undefined &&
      (obj.containerInspect = message.containerInspect
        ? ContainerInspectRequest.toJSON(message.containerInspect)
        : undefined)
    return obj
  },
}

function createBaseContainerStateRequest(): ContainerStateRequest {
  return {}
}

export const ContainerStateRequest = {
  fromJSON(object: any): ContainerStateRequest {
    return { oneShot: isSet(object.oneShot) ? Boolean(object.oneShot) : undefined }
  },

  toJSON(message: ContainerStateRequest): unknown {
    const obj: any = {}
    message.oneShot !== undefined && (obj.oneShot = message.oneShot)
    return obj
  },
}

function createBaseCloseConnectionRequest(): CloseConnectionRequest {
  return { reason: 0 }
}

export const CloseConnectionRequest = {
  fromJSON(object: any): CloseConnectionRequest {
    return { reason: isSet(object.reason) ? closeReasonFromJSON(object.reason) : 0 }
  },

  toJSON(message: CloseConnectionRequest): unknown {
    const obj: any = {}
    message.reason !== undefined && (obj.reason = closeReasonToJSON(message.reason))
    return obj
  },
}

function createBaseContainerCommandRequest(): ContainerCommandRequest {
  return { name: '', operation: 0 }
}

export const ContainerCommandRequest = {
  fromJSON(object: any): ContainerCommandRequest {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      operation: isSet(object.operation) ? containerOperationFromJSON(object.operation) : 0,
    }
  },

  toJSON(message: ContainerCommandRequest): unknown {
    const obj: any = {}
    message.name !== undefined && (obj.name = message.name)
    message.operation !== undefined && (obj.operation = containerOperationToJSON(message.operation))
    return obj
  },
}

function createBaseContainerDeleteRequest(): ContainerDeleteRequest {
  return { name: '' }
}

export const ContainerDeleteRequest = {
  fromJSON(object: any): ContainerDeleteRequest {
    return { name: isSet(object.name) ? String(object.name) : '' }
  },

  toJSON(message: ContainerDeleteRequest): unknown {
    const obj: any = {}
    message.name !== undefined && (obj.name = message.name)
    return obj
  },
}

function createBaseContainerLogRequest(): ContainerLogRequest {
  return { name: '', streaming: false, tail: 0 }
}

export const ContainerLogRequest = {
  fromJSON(object: any): ContainerLogRequest {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      streaming: isSet(object.streaming) ? Boolean(object.streaming) : false,
      tail: isSet(object.tail) ? Number(object.tail) : 0,
    }
  },

  toJSON(message: ContainerLogRequest): unknown {
    const obj: any = {}
    message.name !== undefined && (obj.name = message.name)
    message.streaming !== undefined && (obj.streaming = message.streaming)
    message.tail !== undefined && (obj.tail = Math.round(message.tail))
    return obj
  },
}

function createBaseContainerInspectRequest(): ContainerInspectRequest {
  return { name: '' }
}

export const ContainerInspectRequest = {
  fromJSON(object: any): ContainerInspectRequest {
    return { name: isSet(object.name) ? String(object.name) : '' }
  },

  toJSON(message: ContainerInspectRequest): unknown {
    const obj: any = {}
    message.name !== undefined && (obj.name = message.name)
    return obj
  },
}

function createBaseContainerStateItemPort(): ContainerStateItemPort {
  return { internal: 0, external: 0 }
}

export const ContainerStateItemPort = {
  fromJSON(object: any): ContainerStateItemPort {
    return {
      internal: isSet(object.internal) ? Number(object.internal) : 0,
      external: isSet(object.external) ? Number(object.external) : 0,
    }
  },

  toJSON(message: ContainerStateItemPort): unknown {
    const obj: any = {}
    message.internal !== undefined && (obj.internal = Math.round(message.internal))
    message.external !== undefined && (obj.external = Math.round(message.external))
    return obj
  },
}

function createBaseContainerStateItem(): ContainerStateItem {
  return { name: '', command: '', createdAt: undefined, state: 0, reason: '', imageName: '', imageTag: '', ports: [] }
}

export const ContainerStateItem = {
  fromJSON(object: any): ContainerStateItem {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      command: isSet(object.command) ? String(object.command) : '',
      createdAt: isSet(object.createdAt) ? fromJsonTimestamp(object.createdAt) : undefined,
      state: isSet(object.state) ? containerStateFromJSON(object.state) : 0,
      reason: isSet(object.reason) ? String(object.reason) : '',
      imageName: isSet(object.imageName) ? String(object.imageName) : '',
      imageTag: isSet(object.imageTag) ? String(object.imageTag) : '',
      ports: Array.isArray(object?.ports) ? object.ports.map((e: any) => ContainerStateItemPort.fromJSON(e)) : [],
    }
  },

  toJSON(message: ContainerStateItem): unknown {
    const obj: any = {}
    message.name !== undefined && (obj.name = message.name)
    message.command !== undefined && (obj.command = message.command)
    message.createdAt !== undefined && (obj.createdAt = fromTimestamp(message.createdAt).toISOString())
    message.state !== undefined && (obj.state = containerStateToJSON(message.state))
    message.reason !== undefined && (obj.reason = message.reason)
    message.imageName !== undefined && (obj.imageName = message.imageName)
    message.imageTag !== undefined && (obj.imageTag = message.imageTag)
    if (message.ports) {
      obj.ports = message.ports.map(e => (e ? ContainerStateItemPort.toJSON(e) : undefined))
    } else {
      obj.ports = []
    }
    return obj
  },
}

function createBaseContainerStateListMessage(): ContainerStateListMessage {
  return { data: [] }
}

export const ContainerStateListMessage = {
  fromJSON(object: any): ContainerStateListMessage {
    return { data: Array.isArray(object?.data) ? object.data.map((e: any) => ContainerStateItem.fromJSON(e)) : [] }
  },

  toJSON(message: ContainerStateListMessage): unknown {
    const obj: any = {}
    if (message.data) {
      obj.data = message.data.map(e => (e ? ContainerStateItem.toJSON(e) : undefined))
    } else {
      obj.data = []
    }
    return obj
  },
}

function createBaseContainerLogMessage(): ContainerLogMessage {
  return { log: '' }
}

export const ContainerLogMessage = {
  fromJSON(object: any): ContainerLogMessage {
    return { log: isSet(object.log) ? String(object.log) : '' }
  },

  toJSON(message: ContainerLogMessage): unknown {
    const obj: any = {}
    message.log !== undefined && (obj.log = message.log)
    return obj
  },
}

function createBaseContainerInspectMessage(): ContainerInspectMessage {
  return { name: '', inspection: '' }
}

export const ContainerInspectMessage = {
  fromJSON(object: any): ContainerInspectMessage {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      inspection: isSet(object.inspection) ? String(object.inspection) : '',
    }
  },

  toJSON(message: ContainerInspectMessage): unknown {
    const obj: any = {}
    message.name !== undefined && (obj.name = message.name)
    message.inspection !== undefined && (obj.inspection = message.inspection)
    return obj
  },
}

/** Backend gRPC service */

export interface AgentClient {
  connect(request: AgentInfo, metadata: Metadata, ...rest: any): Observable<AgentCommand>

  containerState(request: Observable<ContainerStateListMessage>, metadata: Metadata, ...rest: any): Observable<Empty>

  deleteContainer(request: ContainerDeleteRequest, metadata: Metadata, ...rest: any): Observable<Empty>

  containerLog(request: Observable<ContainerLogMessage>, metadata: Metadata, ...rest: any): Observable<Empty>

  containerInspect(request: ContainerInspectMessage, metadata: Metadata, ...rest: any): Observable<Empty>
}

/** Backend gRPC service */

export interface AgentController {
  connect(request: AgentInfo, metadata: Metadata, ...rest: any): Observable<AgentCommand>

  containerState(
    request: Observable<ContainerStateListMessage>,
    metadata: Metadata,
    ...rest: any
  ): Promise<Empty> | Observable<Empty> | Empty

  deleteContainer(
    request: ContainerDeleteRequest,
    metadata: Metadata,
    ...rest: any
  ): Promise<Empty> | Observable<Empty> | Empty

  containerLog(
    request: Observable<ContainerLogMessage>,
    metadata: Metadata,
    ...rest: any
  ): Promise<Empty> | Observable<Empty> | Empty

  containerInspect(
    request: ContainerInspectMessage,
    metadata: Metadata,
    ...rest: any
  ): Promise<Empty> | Observable<Empty> | Empty
}

export function AgentControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['connect', 'deleteContainer', 'containerInspect']
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method)
      GrpcMethod('Agent', method)(constructor.prototype[method], method, descriptor)
    }
    const grpcStreamMethods: string[] = ['containerState', 'containerLog']
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method)
      GrpcStreamMethod('Agent', method)(constructor.prototype[method], method, descriptor)
    }
  }
}

export const AGENT_SERVICE_NAME = 'Agent'

function toTimestamp(date: Date): Timestamp {
  const seconds = date.getTime() / 1_000
  const nanos = (date.getTime() % 1_000) * 1_000_000
  return { seconds, nanos }
}

function fromTimestamp(t: Timestamp): Date {
  let millis = t.seconds * 1_000
  millis += t.nanos / 1_000_000
  return new Date(millis)
}

function fromJsonTimestamp(o: any): Timestamp {
  if (o instanceof Date) {
    return toTimestamp(o)
  } else if (typeof o === 'string') {
    return toTimestamp(new Date(o))
  } else {
    return Timestamp.fromJSON(o)
  }
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined
}
