import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepository } from './ports/account.repository';
import type { Account, NewAccount } from '../domain/account';

@Injectable()
export class AccountsService {
  constructor(private readonly repository: AccountRepository) {}

  create(ownerId: string, data: NewAccount): Promise<Account> {
    return this.repository.create(ownerId, data);
  }

  list(ownerId: string, limit: number, offset: number): Promise<Account[]> {
    return this.repository.list(ownerId, limit, offset);
  }

  async find(ownerId: string, id: string): Promise<Account> {
    const account = await this.repository.find(ownerId, id);
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
}
