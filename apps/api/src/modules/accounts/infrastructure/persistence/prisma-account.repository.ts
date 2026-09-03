import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infrastructure/database/database.service';
import type { Account as StoredAccount } from '../../../../generated/prisma/client';
import type { Account, NewAccount } from '../../domain/account';
import { AccountRepository } from '../../application/ports/account.repository';

function toAccount(row: StoredAccount): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    openingBalance: row.openingBalance.toFixed(2),
    createdAt: row.createdAt.toISOString(),
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
  ): Promise<Account[]> {
    const rows = await this.database.client.account.findMany({
      where: { ownerId },
      take: limit,
      skip: offset,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(toAccount);
  }

  async find(ownerId: string, id: string): Promise<Account | null> {
    const row = await this.database.client.account.findFirst({
      where: { ownerId, id },
    });
    return row ? toAccount(row) : null;
  }
}
