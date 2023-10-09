import { CanActivate, ExecutionContext, Injectable, Logger, SetMetadata, createParamDecorator } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { CruxUnauthorizedException } from 'src/exception/crux-exception'
import PrismaService from 'src/services/prisma.service'
import { AuthToken } from './auth.dto'

export const AUTH_COOKIE = 'auth'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

export const AuthUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  const user = request['user'] as AuthToken
  return user?.sub
})

export const isAuthDisabled = (config: ConfigService) => config.get('DISABLE_AUTH') === 'true'

@Injectable()
export class AuthGuard implements CanActivate {
  private static readonly logger = new Logger('AUTH')

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async validateRequest(request: Request): Promise<boolean> {
    const token = request.cookies?.[AUTH_COOKIE]
    if (!token) {
      AuthGuard.logger.warn('Request has no token')
      return false
    }
    try {
      const payload: AuthToken = await this.jwtService.verifyAsync(token)
      const { sub } = payload

      const user = await this.prisma.user.findFirst({
        where: {
          id: sub,
        },
      })

      if (!user) {
        AuthGuard.logger.warn(`Token has unknown user '${sub}'`)
        return false
      }

      request['user'] = payload
    } catch {
      AuthGuard.logger.warn(`Token is invalid`)
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
