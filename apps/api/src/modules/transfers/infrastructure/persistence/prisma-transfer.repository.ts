import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type Transfer as StoredTransfer,
} from '../../../../generated/prisma/client';
import { DatabaseService } from '../../../../infrastructure/database/database.service';
import { TransferRepository } from '../../application/ports/transfer.repository';
import type {
  NewTransfer,
  Transfer,
  TransferCreation,
} from '../../domain/transfer';

type LockedAccount = {
  id: string;
  name: string;
  currency: 'PEN' | 'USD';
};

function toTransfer(row: StoredTransfer, currency: 'PEN' | 'USD'): Transfer {
  return {
    id: row.id,
    fromAccountId: row.fromAccountId,
    toAccountId: row.toAccountId,
    amount: row.amount.toFixed(2),
    date: row.date.toISOString().slice(0, 10),
    description: row.description,
    idempotencyKey: row.idempotencyKey,
    currency,
    createdAt: row.createdAt.toISOString(),
  };
}

function matches(row: StoredTransfer, data: NewTransfer) {
  return (
    row.fromAccountId === data.fromAccountId &&
    row.toAccountId === data.toAccountId &&
    row.amount.equals(data.amount) &&
    row.date.toISOString().slice(0, 10) === data.date &&
    row.description === data.description
  );
}

function movementDescription(direction: string, account: string, note: string) {
  return `${direction} ${account}${note ? ` · ${note}` : ''}`.slice(0, 250);
}

@Injectable()
export class PrismaTransferRepository extends TransferRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async create(ownerId: string, data: NewTransfer): Promise<TransferCreation> {
    try {
      return await this.database.client.$transaction(async (client) => {
        const existing = await client.transfer.findUnique({
          where: {
            ownerId_idempotencyKey: {
              ownerId,
              idempotencyKey: data.idempotencyKey,
            },
          },
          include: { fromAccount: { select: { currency: true } } },
        });
        if (existing)
          return matches(existing, data)
            ? {
                status: 'duplicate' as const,
                transfer: toTransfer(existing, existing.fromAccount.currency),
              }
            : { status: 'conflict' as const };

        const accounts = await client.$queryRaw<LockedAccount[]>`
          SELECT id, name, currency
          FROM accounts
          WHERE owner_id = ${ownerId}::uuid
            AND archived_at IS NULL
            AND id IN (${data.fromAccountId}::uuid, ${data.toAccountId}::uuid)
          ORDER BY id
          FOR UPDATE`;
        if (accounts.length !== 2)
          return { status: 'account-not-found' as const };
        const from = accounts.find(
          (account) => account.id === data.fromAccountId,
        )!;
        const to = accounts.find((account) => account.id === data.toAccountId)!;
        if (from.currency !== to.currency)
          return { status: 'currency-mismatch' as const };

        const transfer = await client.transfer.create({
          data: {
            ...data,
            ownerId,
            date: new Date(`${data.date}T00:00:00.000Z`),
          },
        });
        await client.transaction.createMany({
          data: [
            {
              ownerId,
              accountId: from.id,
              type: 'EXPENSE',
              category: 'TRANSFER',
              amount: data.amount,
              date: new Date(`${data.date}T00:00:00.000Z`),
              description: movementDescription(
                'Transferencia a',
                to.name,
                data.description,
              ),
              idempotencyKey: randomUUID(),
              transferId: transfer.id,
            },
            {
              ownerId,
              accountId: to.id,
              type: 'INCOME',
              category: 'TRANSFER',
              amount: data.amount,
              date: new Date(`${data.date}T00:00:00.000Z`),
              description: movementDescription(
                'Transferencia desde',
                from.name,
                data.description,
              ),
              idempotencyKey: randomUUID(),
              transferId: transfer.id,
            },
          ],
        });
        return {
          status: 'created' as const,
          transfer: toTransfer(transfer, from.currency),
        };
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      )
        throw error;
      const existing = await this.database.client.transfer.findUnique({
        where: {
          ownerId_idempotencyKey: {
            ownerId,
            idempotencyKey: data.idempotencyKey,
          },
        },
        include: { fromAccount: { select: { currency: true } } },
      });
      return existing && matches(existing, data)
        ? {
            status: 'duplicate',
            transfer: toTransfer(existing, existing.fromAccount.currency),
          }
        : { status: 'conflict' };
    }
  }
}
