import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransactionRepository } from './ports/transaction.repository';
import {
  CATEGORY_TYPES,
  type NewTransaction,
  type TransactionQuery,
  type TransactionChanges,
} from '../domain/transaction';
@Injectable()
export class TransactionsService {
  constructor(private readonly repository: TransactionRepository) {}
  private async assertAccount(ownerId: string, accountId: string) {
    if (!(await this.repository.ownsAccount(ownerId, accountId)))
      throw new NotFoundException('Account not found');
  }
  async create(ownerId: string, accountId: string, data: NewTransaction) {
    if (
      CATEGORY_TYPES[data.category] !== 'BOTH' &&
      CATEGORY_TYPES[data.category] !== data.type
    )
      throw new BadRequestException('Category does not match transaction type');
    await this.assertAccount(ownerId, accountId);
    const result = await this.repository.create(ownerId, accountId, data);
    if (!result)
      throw new ConflictException(
        'Idempotency key already used with different data',
      );
    return result;
  }
  async list(ownerId: string, accountId: string, query: TransactionQuery) {
    if (query.from && query.to && query.from > query.to)
      throw new BadRequestException('Invalid date range');
    await this.assertAccount(ownerId, accountId);
    return {
      items: await this.repository.list(ownerId, accountId, query),
      limit: query.limit,
      offset: query.offset,
    };
  }
  private assertCategory(data: TransactionChanges) {
    if (
      CATEGORY_TYPES[data.category] !== 'BOTH' &&
      CATEGORY_TYPES[data.category] !== data.type
    )
      throw new BadRequestException('Category does not match transaction type');
  }
  async update(
    ownerId: string,
    accountId: string,
    transactionId: string,
    data: TransactionChanges,
  ) {
    this.assertCategory(data);
    await this.assertAccount(ownerId, accountId);
    const result = await this.repository.update(
      ownerId,
      accountId,
      transactionId,
      data,
    );
    if (!result) throw new NotFoundException('Transaction not found');
    return result;
  }
  async delete(ownerId: string, accountId: string, transactionId: string) {
    await this.assertAccount(ownerId, accountId);
    if (!(await this.repository.delete(ownerId, accountId, transactionId)))
      throw new NotFoundException('Transaction not found');
    return { deleted: true };
  }
  async balance(ownerId: string, accountId: string) {
    const result = await this.repository.balance(ownerId, accountId);
    if (!result) throw new NotFoundException('Account not found');
    return result;
  }
}
