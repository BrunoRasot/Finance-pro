import type { CategoryTotal } from '../../domain/monthly-report';
export abstract class ReportRepository {
  abstract monthly(ownerId: string, month: string): Promise<CategoryTotal[]>;
}
