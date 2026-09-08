import type { NewTransfer, TransferCreation } from '../../domain/transfer';

export abstract class TransferRepository {
  abstract create(
    ownerId: string,
    data: NewTransfer,
  ): Promise<TransferCreation>;
}
