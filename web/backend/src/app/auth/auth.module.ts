import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import PrismaService from 'src/services/prisma.service'
import { AuthGuard } from './auth.guard'
import AuthController from './auth.http.controller'
import AuthService from './auth.service'
import { UserService } from './user.service'

export const AuthJwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET'),
    signOptions: { issuer: configService.get('PUBLIC_URL') },
    verifyOptions: {
      issuer: configService.get('PUBLIC_URL'),
    },
  }),
})

@Module({
  imports: [AuthJwtModule],
  providers: [
    PrismaService,
    AuthService,
    UserService,
    AuthGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
