import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { NewTransfer } from '../domain/transfer';
import { TransferRepository } from './ports/transfer.repository';

@Injectable()
export class TransfersService {
  constructor(private readonly repository: TransferRepository) {}

  async create(ownerId: string, data: NewTransfer) {
    if (data.fromAccountId === data.toAccountId)
      throw new BadRequestException('Transfer accounts must be different');
    const result = await this.repository.create(ownerId, data);
    if (result.status === 'account-not-found')
      throw new NotFoundException('Account not found');
    if (result.status === 'currency-mismatch')
      throw new BadRequestException('Accounts must use the same currency');
    if (result.status === 'conflict')
      throw new ConflictException(
        'Idempotency key already used with different data',
      );
    return result.transfer;
  }
}
