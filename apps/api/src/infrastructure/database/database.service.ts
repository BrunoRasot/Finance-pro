import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import type { Environment } from '../../config/environment';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly instance?: PrismaClient;

  constructor(config: ConfigService<Environment, true>) {
    const url = config.get('DATABASE_URL', { infer: true });
    if (url) {
      this.instance = new PrismaClient({
        adapter: new PrismaPg({
          connectionString: url,
          max: 5,
          connectionTimeoutMillis: 3000,
        }),
      });
    }
  }

  get client(): PrismaClient {
    if (!this.instance)
      throw new ServiceUnavailableException('Database unavailable');
    return this.instance;
  }

  async onModuleDestroy(): Promise<void> {
    await this.instance?.$disconnect();
  }
}
