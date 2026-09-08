import type { Account, AccountChanges, NewAccount } from '../../domain/account';

export abstract class AccountRepository {
  abstract create(ownerId: string, account: NewAccount): Promise<Account>;
  abstract list(
    ownerId: string,
    limit: number,
    offset: number,
    archived: boolean,
  ): Promise<Account[]>;
  abstract find(ownerId: string, id: string): Promise<Account | null>;
  abstract update(
    ownerId: string,
    id: string,
    changes: AccountChanges,
  ): Promise<Account | null>;
  abstract setArchived(
    ownerId: string,
    id: string,
    archived: boolean,
  ): Promise<Account | null>;
}
