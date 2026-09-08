export interface SavingsGoal {
  id: string;
  name: string;
  currency: 'PEN' | 'USD';
  targetAmount: string;
  savedAmount: string;
  remainingAmount: string;
  progressPercent: number;
  deadline: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewGoal = Pick<
  SavingsGoal,
  'name' | 'currency' | 'targetAmount' | 'deadline'
>;
export type GoalChanges = Pick<
  SavingsGoal,
  'name' | 'targetAmount' | 'deadline'
>;

export interface NewContribution {
  amount: string;
  date: string;
  note: string;
  idempotencyKey: string;
}

export type ContributionCreation =
  | { status: 'created' | 'duplicate'; goal: SavingsGoal }
  | { status: 'goal-not-found' | 'conflict' };
