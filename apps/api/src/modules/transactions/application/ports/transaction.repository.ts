import type {
  NewTransaction,
  Transaction,
  TransactionQuery,
  AccountBalance,
} from '../../domain/transaction';
export abstract class TransactionRepository {
  abstract ownsAccount(ownerId: string, accountId: string): Promise<boolean>;
  abstract create(
    ownerId: string,
    accountId: string,
    data: NewTransaction,
  ): Promise<Transaction | null>;
  abstract list(
    ownerId: string,
    accountId: string,
    query: TransactionQuery,
  ): Promise<Transaction[]>;
  abstract balance(
    ownerId: string,
    accountId: string,
  ): Promise<AccountBalance | null>;
}
