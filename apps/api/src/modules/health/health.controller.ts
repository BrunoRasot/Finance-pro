import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { Public } from '../../common/security/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Public()
  @Get('ready')
  @Header('Cache-Control', 'no-store')
  async ready(): Promise<{ status: 'ok' }> {
    try {
      await this.database.client.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException();
    }
  }
  @Public()
  @Get('live')
  @Header('Cache-Control', 'no-store')
  live(): { status: 'ok' } {
    // Process liveness is independent of database readiness.
    return { status: 'ok' };
  }
}
