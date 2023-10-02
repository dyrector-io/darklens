import { DynamicModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

export const AppJwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET'),
    signOptions: { issuer: configService.get('AGENT_ADDRESS') },
    verifyOptions: {
      issuer: configService.get('AGENT_ADDRESS'),
    },
  }),
})

export const AppPassportModule = PassportModule.register({ session: true })

export const AppJwtModuleImports: DynamicModule[] = [AppPassportModule, AppJwtModule]
