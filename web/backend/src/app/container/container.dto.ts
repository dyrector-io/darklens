import { IsString } from 'class-validator'

// eslint-disable-next-line import/prefer-default-export
export class ContainerIdentifierDto {
  @IsString()
  prefix: string

  @IsString()
  name: string
}
