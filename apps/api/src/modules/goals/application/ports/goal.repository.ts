import type {
  ContributionCreation,
  GoalChanges,
  NewContribution,
  NewGoal,
  SavingsGoal,
} from '../../domain/goal';

export abstract class GoalRepository {
  abstract create(ownerId: string, data: NewGoal): Promise<SavingsGoal>;
  abstract list(ownerId: string, archived: boolean): Promise<SavingsGoal[]>;
  abstract update(
    ownerId: string,
    id: string,
    data: GoalChanges,
  ): Promise<SavingsGoal | null>;
  abstract setArchived(
    ownerId: string,
    id: string,
    archived: boolean,
  ): Promise<SavingsGoal | null>;
  abstract contribute(
    ownerId: string,
    goalId: string,
    data: NewContribution,
  ): Promise<ContributionCreation>;
}
