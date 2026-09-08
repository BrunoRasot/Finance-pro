import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infrastructure/database/database.service';
import { BudgetRepository } from '../../application/ports/budget.repository';
import type { Budget, BudgetInput } from '../../domain/budget';

type BudgetRow = {
  id: string;
  month: Date;
  currency: 'PEN' | 'USD';
  category: Budget['category'];
  amount: string;
  spent: string;
  createdAt: Date;
  updatedAt: Date;
};

function toBudget(row: BudgetRow): Budget {
  const amountCents = BigInt(row.amount.replace('.', ''));
  const spentCents = BigInt(row.spent.replace('.', ''));
  const remainingCents = amountCents - spentCents;
  const decimal = (cents: bigint) => {
    const sign = cents < 0n ? '-' : '';
    const absolute = cents < 0n ? -cents : cents;
    return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`;
  };
  return {
    id: row.id,
    month: row.month.toISOString().slice(0, 7),
    currency: row.currency,
    category: row.category,
    amount: row.amount,
    spent: decimal(spentCents),
    remaining: decimal(remainingCents),
    usagePercent:
      amountCents === 0n
        ? 0
        : Number((spentCents * 10_000n) / amountCents) / 100,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaBudgetRepository extends BudgetRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async list(ownerId: string, month: string): Promise<Budget[]> {
    const start = `${month}-01`;
    const rows = await this.database.client.$queryRaw<BudgetRow[]>`
      SELECT b.id, b.month, b.currency, b.category,
        b.amount::text AS amount,
        b.created_at AS "createdAt", b.updated_at AS "updatedAt",
        COALESCE(SUM(t.amount), 0)::text AS spent
      FROM budgets b
      LEFT JOIN accounts a
        ON a.owner_id = b.owner_id AND a.currency = b.currency
      LEFT JOIN transactions t
        ON t.account_id = a.id AND t.owner_id = b.owner_id
        AND t.type = 'EXPENSE' AND t.transfer_id IS NULL
        AND t.category::text = b.category::text
        AND t.date >= b.month AND t.date < (b.month + INTERVAL '1 month')
      WHERE b.owner_id = ${ownerId}::uuid AND b.month = ${start}::date
      GROUP BY b.id
      ORDER BY b.currency, b.category`;
    return rows.map(toBudget);
  }

  async save(ownerId: string, input: BudgetInput): Promise<Budget> {
    const month = new Date(`${input.month}-01T00:00:00.000Z`);
    const row = await this.database.client.budget.upsert({
      where: {
        ownerId_month_currency_category: {
          ownerId,
          month,
          currency: input.currency,
          category: input.category,
        },
      },
      create: { ...input, ownerId, month },
      update: { amount: input.amount },
    });
    const budgets = await this.list(ownerId, input.month);
    return budgets.find((budget) => budget.id === row.id)!;
  }

  async remove(ownerId: string, id: string): Promise<boolean> {
    const result = await this.database.client.budget.deleteMany({
      where: { ownerId, id },
    });
    return result.count === 1;
  }
}
