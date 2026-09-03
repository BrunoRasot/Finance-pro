import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infrastructure/database/database.service';
import {
  Prisma,
  type Transaction as StoredTransaction,
} from '../../../../generated/prisma/client';
import { TransactionRepository } from '../../application/ports/transaction.repository';
import type {
  AccountBalance,
  NewTransaction,
  Transaction,
  TransactionQuery,
} from '../../domain/transaction';
function toTransaction(row: StoredTransaction): Transaction {
  return {
    id: row.id,
    accountId: row.accountId,
    type: row.type,
    category: row.category,
    amount: row.amount.toFixed(2),
    date: row.date.toISOString().slice(0, 10),
    description: row.description,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt.toISOString(),
  };
}
@Injectable()
export class PrismaTransactionRepository extends TransactionRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }
  async ownsAccount(ownerId: string, accountId: string) {
    return !!(await this.database.client.account.findFirst({
      where: { id: accountId, ownerId },
      select: { id: true },
    }));
  }
  async create(
    ownerId: string,
    accountId: string,
    data: NewTransaction,
  ): Promise<Transaction | null> {
    try {
      return toTransaction(
        await this.database.client.transaction.create({
          data: {
            ...data,
            ownerId,
            accountId,
            date: new Date(`${data.date}T00:00:00.000Z`),
          },
        }),
      );
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      )
        throw error;
      const existing = await this.database.client.transaction.findUnique({
        where: {
          ownerId_idempotencyKey: {
            ownerId,
            idempotencyKey: data.idempotencyKey,
          },
        },
      });
      if (
        !existing ||
        existing.accountId !== accountId ||
        existing.type !== data.type ||
        existing.category !== data.category ||
        !existing.amount.equals(data.amount) ||
        existing.date.toISOString().slice(0, 10) !== data.date ||
        existing.description !== data.description
      )
        return null;
      return toTransaction(existing);
    }
  }
  async list(ownerId: string, accountId: string, query: TransactionQuery) {
    return (
      await this.database.client.transaction.findMany({
        where: {
          ownerId,
          accountId,
          type: query.type,
          category: query.category,
          date: {
            gte: query.from
              ? new Date(`${query.from}T00:00:00.000Z`)
              : undefined,
            lte: query.to ? new Date(`${query.to}T00:00:00.000Z`) : undefined,
          },
        },
        take: query.limit,
        skip: query.offset,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      })
    ).map(toTransaction);
  }
  async balance(
    ownerId: string,
    accountId: string,
  ): Promise<AccountBalance | null> {
    // A single PostgreSQL statement gives a consistent snapshot and exact numeric sums.
    const rows = await this.database.client.$queryRaw<AccountBalance[]>`
      SELECT a.id AS "accountId", a.currency, a.opening_balance::text AS "openingBalance",
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'INCOME'), 0.00)::text AS "totalIncome",
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE'), 0.00)::text AS "totalExpense",
        (a.opening_balance + COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END), 0.00))::text AS balance
      FROM accounts a LEFT JOIN transactions t ON t.account_id = a.id AND t.owner_id = a.owner_id
      WHERE a.id = ${accountId}::uuid AND a.owner_id = ${ownerId}::uuid
      GROUP BY a.id, a.currency, a.opening_balance`;
    return rows[0] ?? null;
  }
}
