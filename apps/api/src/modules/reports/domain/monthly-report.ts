import type {
  Category,
  TransactionType,
} from '../../transactions/domain/transaction';
export type ReportCurrency = 'PEN' | 'USD';
export interface CategoryTotal {
  currency: ReportCurrency;
  type: TransactionType;
  category: Category;
  total: string;
  count: string;
}
export interface MonthlyCurrencyReport {
  currency: ReportCurrency;
  income: string;
  expense: string;
  net: string;
  categories: Omit<CategoryTotal, 'currency'>[];
}
export function cents(amount: string): bigint {
  const [whole = '0', fraction = '00'] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}
export function decimal(value: bigint): string {
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}
export function monthlyReport(month: string, rows: CategoryTotal[]) {
  const currencies: MonthlyCurrencyReport[] = (['PEN', 'USD'] as const).map(
    (currency) => {
      const selected = rows.filter((row) => row.currency === currency);
      const sum = (type: TransactionType) =>
        selected
          .filter((row) => row.type === type)
          .reduce((total, row) => total + cents(row.total), 0n);
      const income = sum('INCOME');
      const expense = sum('EXPENSE');
      return {
        currency,
        income: decimal(income),
        expense: decimal(expense),
        net: decimal(income - expense),
        categories: selected.map(({ type, category, total, count }) => ({
          type,
          category,
          total,
          count,
        })),
      };
    },
  );
  return { month, currencies };
}
