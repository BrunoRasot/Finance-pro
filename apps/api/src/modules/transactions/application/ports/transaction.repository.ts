import type {
  NewTransaction,
  Transaction,
  StoredTransaction,
  TransactionQuery,
  AccountBalance,
  TransactionChanges,
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
  ): Promise<StoredTransaction[]>;
  abstract update(
    ownerId: string,
    accountId: string,
    transactionId: string,
    data: TransactionChanges,
  ): Promise<Transaction | null>;
  abstract delete(
    ownerId: string,
    accountId: string,
    transactionId: string,
  ): Promise<boolean>;
  abstract balance(
    ownerId: string,
    accountId: string,
  ): Promise<AccountBalance | null>;
}
