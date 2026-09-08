export const ACCOUNT_TYPES = ['CASH', 'BANK', 'WALLET'] as const;
export const CURRENCIES = ['PEN', 'USD'] as const;

export interface Account {
  id: string;
  name: string;
  type: (typeof ACCOUNT_TYPES)[number];
  currency: (typeof CURRENCIES)[number];
  openingBalance: string;
  createdAt: string;
  archivedAt: string | null;
}

export type NewAccount = Omit<Account, 'id' | 'createdAt' | 'archivedAt'>;
export type AccountChanges = Pick<Account, 'name' | 'type' | 'openingBalance'>;
