import type { Budget, BudgetInput } from '../../domain/budget';

export abstract class BudgetRepository {
  abstract list(ownerId: string, month: string): Promise<Budget[]>;
  abstract save(ownerId: string, input: BudgetInput): Promise<Budget>;
  abstract remove(ownerId: string, id: string): Promise<boolean>;
}
