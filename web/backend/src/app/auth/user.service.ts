import { Injectable } from '@nestjs/common'
import PrismaService from 'src/services/prisma.service'

export type User = {
  id: string
  name: string
  password: string
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async hasUsers(): Promise<boolean> {
    return (await this.prisma.user.findFirst()) != null
  }

  async findById(id: string): Promise<User | undefined> {
    return await this.prisma.user.findFirst({
      where: {
        id,
      },
    })
  }

  async findByName(name: string): Promise<User | undefined> {
    return await this.prisma.user.findFirst({
      where: {
        name,
      },
    })
  }

  async create(name: string, passwordHash: string): Promise<string> {
    const data = await this.prisma.user.create({
      data: {
        name,
        password: passwordHash,
      },
      select: {
        id: true,
      },
    })

    return data.id
  }
}
