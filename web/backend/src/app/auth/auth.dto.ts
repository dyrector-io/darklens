import { IsString, MinLength } from 'class-validator'

export interface AuthToken {
  sub: string
  username: string
}

export class LoginDto {
  @IsString()
  @MinLength(1)
  name: string

  @IsString()
  @MinLength(1)
  password: string
}

export class ProfileDto {
  @IsString()
  name: string
}
