import 'server-only';
import { apiRequest } from './api';
import { monthlyReportSchema } from '@/features/reports/model';
export async function getMonthlyReport(month: string) {
  const response = await apiRequest(
    `/reports/monthly?${new URLSearchParams({ month })}`,
  );
  if (!response.ok) throw new Error('Monthly report unavailable');
  return monthlyReportSchema.parse(await response.json());
}
