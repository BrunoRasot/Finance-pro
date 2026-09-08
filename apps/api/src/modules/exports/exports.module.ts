import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ExportsService } from './application/exports.service';
import { ExportsController } from './presentation/exports.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
