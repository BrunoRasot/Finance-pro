import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { GoalChanges, NewContribution, NewGoal } from '../domain/goal';
import { GoalRepository } from './ports/goal.repository';

@Injectable()
export class GoalsService {
  constructor(private readonly repository: GoalRepository) {}
  create(ownerId: string, data: NewGoal) {
    return this.repository.create(ownerId, data);
  }
  list(ownerId: string, archived: boolean) {
    return this.repository.list(ownerId, archived);
  }
  async update(ownerId: string, id: string, data: GoalChanges) {
    const goal = await this.repository.update(ownerId, id, data);
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }
  async setArchived(ownerId: string, id: string, archived: boolean) {
    const goal = await this.repository.setArchived(ownerId, id, archived);
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }
  async contribute(ownerId: string, goalId: string, data: NewContribution) {
    const result = await this.repository.contribute(ownerId, goalId, data);
    if (result.status === 'goal-not-found')
      throw new NotFoundException('Goal not found');
    if (result.status === 'conflict')
      throw new ConflictException('Idempotency key conflict');
    if ('goal' in result) return result.goal;
    throw new NotFoundException('Goal not found');
  }
}
