import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infrastructure/database/database.service';
import { ReportRepository } from '../../application/ports/report.repository';
import type { CategoryTotal } from '../../domain/monthly-report';
@Injectable()
export class PrismaReportRepository extends ReportRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }
  monthly(ownerId: string, month: string): Promise<CategoryTotal[]> {
    const start = `${month}-01`;
    return this.database.client.$queryRaw<CategoryTotal[]>`
      SELECT a.currency, t.type, t.category, SUM(t.amount)::text AS total, COUNT(*)::text AS count
      FROM accounts a JOIN transactions t ON t.account_id = a.id AND t.owner_id = a.owner_id
      WHERE a.owner_id = ${ownerId}::uuid AND t.owner_id = ${ownerId}::uuid
        AND t.date >= ${start}::date AND t.date < (${start}::date + INTERVAL '1 month')
      GROUP BY a.currency, t.type, t.category
      ORDER BY a.currency, t.type, SUM(t.amount) DESC, t.category`;
  }
}
