import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import PrismaService from 'src/services/prisma.service'
import { HealthDto } from './health.dto'

@Injectable()
export default class HealthService {
  private logger = new Logger(HealthService.name)

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getCruxHealth(): Promise<HealthDto> {
    let lastMigration: string = null
    try {
      lastMigration = await this.prisma.findLastMigration()
    } catch (err) {
      const error: Error = err

      this.logger.error(`Failed to query the last migration from the database: ${error?.message}`, error?.stack)
    }

    const version = this.configService.get<string>('npm_package_version')

    return {
      version,
      status: lastMigration ? 'operational' : 'disrupted',
      lastMigration,
    }
  }
}
