import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepository } from './ports/account.repository';
import type { Account, AccountChanges, NewAccount } from '../domain/account';

@Injectable()
export class AccountsService {
  constructor(private readonly repository: AccountRepository) {}

  create(ownerId: string, data: NewAccount): Promise<Account> {
    return this.repository.create(ownerId, data);
  }

  list(
    ownerId: string,
    limit: number,
    offset: number,
    archived: boolean,
  ): Promise<Account[]> {
    return this.repository.list(ownerId, limit, offset, archived);
  }

  async find(ownerId: string, id: string): Promise<Account> {
    const account = await this.repository.find(ownerId, id);
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(ownerId: string, id: string, changes: AccountChanges) {
    const account = await this.repository.update(ownerId, id, changes);
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async setArchived(ownerId: string, id: string, archived: boolean) {
    const account = await this.repository.setArchived(ownerId, id, archived);
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
}
