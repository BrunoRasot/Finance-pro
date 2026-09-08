import { Injectable, NotFoundException } from '@nestjs/common';
import type { BudgetInput } from '../domain/budget';
import { BudgetRepository } from './ports/budget.repository';

@Injectable()
export class BudgetsService {
  constructor(private readonly repository: BudgetRepository) {}

  list(ownerId: string, month: string) {
    return this.repository.list(ownerId, month);
  }

  save(ownerId: string, input: BudgetInput) {
    return this.repository.save(ownerId, input);
  }

  async remove(ownerId: string, id: string) {
    if (!(await this.repository.remove(ownerId, id)))
      throw new NotFoundException('Budget not found');
  }
}
