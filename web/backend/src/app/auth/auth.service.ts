import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { CruxConflictException, CruxUnauthorizedException } from 'src/exception/crux-exception'
import { AuthToken } from './auth.dto'
import { UserService } from './user.service'

@Injectable()
export default class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string): Promise<string> {
    const user = await this.usersService.findByName(username)
    const passowrdMatch = await bcrypt.compare(pass, user.password)

    if (!passowrdMatch) {
      throw new CruxUnauthorizedException()
    }

    const payload: AuthToken = { sub: user.id, username: user.name }
    return await this.jwtService.signAsync(payload)
  }

  async register(username: string, pass: string): Promise<string> {
    const user = await this.usersService.findByName(username)
    if (user) {
      throw new CruxConflictException({ message: 'User already exists!' })
    }

    const passwordHash = await this.hashPassword(pass)
    const userId = await this.usersService.create(username, passwordHash)

    const payload: AuthToken = { sub: userId, username }
    return await this.jwtService.signAsync(payload)
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
  }
}
