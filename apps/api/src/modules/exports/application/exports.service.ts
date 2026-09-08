import { Injectable, PayloadTooLargeException } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service';

const MAX_EXPORT_ROWS = 50_000;
const isoDate = (value: Date) => value.toISOString().slice(0, 10);
const isoTime = (value: Date) => value.toISOString();

function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

@Injectable()
export class ExportsService {
  constructor(private readonly database: DatabaseService) {}

  async backup(ownerId: string) {
    const [accounts, transactions, transfers, budgets, goals, contributions] =
      await this.database.client.$transaction([
        this.database.client.account.findMany({
          where: { ownerId },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        }),
        this.database.client.transaction.findMany({
          where: { ownerId },
          orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        }),
        this.database.client.transfer.findMany({
          where: { ownerId },
          orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        }),
        this.database.client.budget.findMany({
          where: { ownerId },
          orderBy: [{ month: 'asc' }, { currency: 'asc' }, { category: 'asc' }],
        }),
        this.database.client.savingsGoal.findMany({
          where: { ownerId },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        }),
        this.database.client.goalContribution.findMany({
          where: { ownerId },
          orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        }),
      ]);
    const total =
      accounts.length +
      transactions.length +
      transfers.length +
      budgets.length +
      goals.length +
      contributions.length;
    if (total > MAX_EXPORT_ROWS)
      throw new PayloadTooLargeException('Export exceeds row limit');
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      accounts: accounts.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        currency: row.currency,
        openingBalance: row.openingBalance.toFixed(2),
        createdAt: isoTime(row.createdAt),
        archivedAt: row.archivedAt ? isoTime(row.archivedAt) : null,
      })),
      transactions: transactions.map((row) => ({
        id: row.id,
        accountId: row.accountId,
        type: row.type,
        category: row.category,
        amount: row.amount.toFixed(2),
        date: isoDate(row.date),
        description: row.description,
        transferId: row.transferId,
        createdAt: isoTime(row.createdAt),
      })),
      transfers: transfers.map((row) => ({
        id: row.id,
        fromAccountId: row.fromAccountId,
        toAccountId: row.toAccountId,
        amount: row.amount.toFixed(2),
        date: isoDate(row.date),
        description: row.description,
        createdAt: isoTime(row.createdAt),
      })),
      budgets: budgets.map((row) => ({
        id: row.id,
        month: row.month.toISOString().slice(0, 7),
        currency: row.currency,
        category: row.category,
        amount: row.amount.toFixed(2),
        createdAt: isoTime(row.createdAt),
        updatedAt: isoTime(row.updatedAt),
      })),
      goals: goals.map((row) => ({
        id: row.id,
        name: row.name,
        currency: row.currency,
        targetAmount: row.targetAmount.toFixed(2),
        deadline: row.deadline ? isoDate(row.deadline) : null,
        archivedAt: row.archivedAt ? isoTime(row.archivedAt) : null,
        createdAt: isoTime(row.createdAt),
        updatedAt: isoTime(row.updatedAt),
      })),
      goalContributions: contributions.map((row) => ({
        id: row.id,
        goalId: row.goalId,
        amount: row.amount.toFixed(2),
        date: isoDate(row.date),
        note: row.note,
        createdAt: isoTime(row.createdAt),
      })),
    };
  }

  async transactionsCsv(ownerId: string) {
    const rows = await this.database.client.transaction.findMany({
      where: { ownerId },
      include: { account: { select: { name: true, currency: true } } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_EXPORT_ROWS + 1,
    });
    if (rows.length > MAX_EXPORT_ROWS)
      throw new PayloadTooLargeException('Export exceeds row limit');
    const header = [
      'Fecha',
      'Cuenta',
      'Moneda',
      'Tipo',
      'Categoría',
      'Importe',
      'Descripción',
      'Transferencia',
    ];
    const lines = rows.map((row) =>
      [
        isoDate(row.date),
        row.account.name,
        row.account.currency,
        row.type,
        row.category,
        row.amount.toFixed(2),
        row.description,
        row.transferId ?? '',
      ]
        .map(csvCell)
        .join(','),
    );
    return `\uFEFF${header.map(csvCell).join(',')}\r\n${lines.join('\r\n')}\r\n`;
  }
}
