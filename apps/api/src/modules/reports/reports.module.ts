import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ReportRepository } from './application/ports/report.repository';
import { ReportsService } from './application/reports.service';
import { PrismaReportRepository } from './infrastructure/persistence/prisma-report.repository';
import { ReportsController } from './presentation/reports.controller';
@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    { provide: ReportRepository, useClass: PrismaReportRepository },
  ],
})
export class ReportsModule {}
