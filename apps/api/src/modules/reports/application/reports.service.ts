import { Injectable } from '@nestjs/common';
import { ReportRepository } from './ports/report.repository';
import { monthlyReport } from '../domain/monthly-report';
@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportRepository) {}
  async monthly(ownerId: string, month: string) {
    return monthlyReport(month, await this.repository.monthly(ownerId, month));
  }
}
