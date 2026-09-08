import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infrastructure/database/database.service';
import type { Account as StoredAccount } from '../../../../generated/prisma/client';
import type { Account, AccountChanges, NewAccount } from '../../domain/account';
import { AccountRepository } from '../../application/ports/account.repository';

function toAccount(row: StoredAccount): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    openingBalance: row.openingBalance.toFixed(2),
    createdAt: row.createdAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class PrismaAccountRepository extends AccountRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async create(ownerId: string, data: NewAccount): Promise<Account> {
    return toAccount(
      await this.database.client.account.create({ data: { ...data, ownerId } }),
    );
  }

  async list(
    ownerId: string,
    limit: number,
    offset: number,
    archived: boolean,
  ): Promise<Account[]> {
    const rows = await this.database.client.account.findMany({
      where: { ownerId, archivedAt: archived ? { not: null } : null },
      take: limit,
      skip: offset,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(toAccount);
  }

  async find(ownerId: string, id: string): Promise<Account | null> {
    const row = await this.database.client.account.findFirst({
      where: { ownerId, id, archivedAt: null },
    });
    return row ? toAccount(row) : null;
  }

  async update(ownerId: string, id: string, changes: AccountChanges) {
    return this.database.client.$transaction(async (client) => {
      const updated = await client.account.updateMany({
        where: { ownerId, id, archivedAt: null },
        data: changes,
      });
      if (updated.count !== 1) return null;
      return toAccount(
        await client.account.findUniqueOrThrow({ where: { id } }),
      );
    });
  }

  async setArchived(ownerId: string, id: string, archived: boolean) {
    return this.database.client.$transaction(async (client) => {
      const existing = await client.account.findFirst({
        where: { ownerId, id },
      });
      if (!existing) return null;
      if ((existing.archivedAt !== null) === archived)
        return toAccount(existing);
      return toAccount(
        await client.account.update({
          where: { id },
          data: { archivedAt: archived ? new Date() : null },
        }),
      );
    });
  }
}
