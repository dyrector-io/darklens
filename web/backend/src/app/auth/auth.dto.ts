import { IsString, MinLength } from 'class-validator'

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
