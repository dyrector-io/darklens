import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { CruxGoneException, CruxNotFoundException, CruxUnauthorizedException } from 'src/exception/crux-exception'
import { LoginDto, ProfileDto } from './auth.dto'
import { AUTH_COOKIE, AuthGuard, AuthUser, Public, isAuthDisabled } from './auth.guard'
import { AuthService } from './auth.service'
import { UserService } from './user.service'

const ROUTE_AUTH = 'auth'

@Controller(ROUTE_AUTH)
@ApiTags(ROUTE_AUTH)
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private userService: UserService,
    private authGuard: AuthGuard,
  ) {}

  private checkAuth(): void {
    if (isAuthDisabled(this.configService)) {
      throw new CruxNotFoundException({ message: 'Auth disabled' })
    }
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<void> {
    this.checkAuth()

    let token = null
    if (await this.userService.hasUsers()) {
      console.log('A')
      token = await this.authService.signIn(signInDto.name, signInDto.password)
    } else {
      console.log('B')
      token = await this.authService.register(signInDto.name, signInDto.password)
    }

    if (!token) {
      throw new CruxUnauthorizedException()
    }

    response.cookie(AUTH_COOKIE, token)
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
    this.checkAuth()

    response.clearCookie(AUTH_COOKIE)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get()
  async profile(@AuthUser() userId: string, @Req() request: Request): Promise<ProfileDto> {
    this.checkAuth()

    if (!(await this.userService.hasUsers())) {
      throw new CruxGoneException({
        message: 'No users found',
      })
    }

    if (!(await this.authGuard.validateRequest(request))) {
      throw new CruxUnauthorizedException()
    }

    const user = await this.userService.findById(userId)

    return {
      name: user.name,
    }
  }
}
