import { CanActivate, ExceptionFilter, NestInterceptor, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import WsExceptionFilter from 'src/filters/ws.exception-filter'

/* eslint-disable @typescript-eslint/ban-types */
export const UseGlobalWsFilters = (...filters: (ExceptionFilter | Function)[]) =>
  UseFilters(WsExceptionFilter, ...filters)

/* eslint-disable @typescript-eslint/ban-types */
export const UseGlobalWsGuards = (...guards: (CanActivate | Function)[]) => UseGuards(...guards)

/* eslint-disable @typescript-eslint/ban-types */
export const UseGlobalWsInterceptors = (...interceptors: (NestInterceptor | Function)[]) =>
  UseInterceptors(...interceptors)
