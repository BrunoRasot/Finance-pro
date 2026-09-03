import type { Account, NewAccount } from '../../domain/account';

export abstract class AccountRepository {
  abstract create(ownerId: string, account: NewAccount): Promise<Account>;
  abstract list(
    ownerId: string,
    limit: number,
    offset: number,
  ): Promise<Account[]>;
  abstract find(ownerId: string, id: string): Promise<Account | null>;
}
