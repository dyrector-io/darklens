import { CanActivate, ExecutionContext, Injectable, SetMetadata, createParamDecorator } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { CruxUnauthorizedException } from 'src/exception/crux-exception'

export const AUTH_COOKIE = 'auth'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

export const AuthUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  const user = request['user']
  return user?.sub
})

export const isAuthDisabled = (config: ConfigService) => config.get('DISABLE_AUTH') === 'true'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private config: ConfigService,
  ) {}

  async validateRequest(request: Request): Promise<boolean> {
    const token = request.cookies?.[AUTH_COOKIE]
    if (!token) {
      return false
    }
    try {
      const payload = await this.jwtService.verifyAsync(token)
      request['user'] = payload
    } catch {
      return false
    }
    return true
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isAuthDisabled(this.config)) {
      return true
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }

    const request: Request = context.switchToHttp().getRequest()
    if (!(await this.validateRequest(request))) {
      throw new CruxUnauthorizedException()
    }
    return true
  }
}
