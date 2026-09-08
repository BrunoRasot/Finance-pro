export interface NewTransfer {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  date: string;
  description: string;
  idempotencyKey: string;
}

export interface Transfer extends NewTransfer {
  id: string;
  currency: 'PEN' | 'USD';
  createdAt: string;
}

export type TransferCreation =
  | { status: 'created'; transfer: Transfer }
  | { status: 'duplicate'; transfer: Transfer }
  | { status: 'conflict' }
  | { status: 'account-not-found' }
  | { status: 'currency-mismatch' };
