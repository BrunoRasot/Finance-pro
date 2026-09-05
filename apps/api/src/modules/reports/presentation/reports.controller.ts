import { Controller, Get, Header, Query } from '@nestjs/common';
import { Matches } from 'class-validator';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { ReportsService } from '../application/reports.service';
export class MonthlyReportDto {
  @Matches(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/) month!: string;
}
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get('monthly')
  @Header('Cache-Control', 'no-store')
  monthly(@CurrentUser() ownerId: string, @Query() query: MonthlyReportDto) {
    return this.reports.monthly(ownerId, query.month);
  }
}
