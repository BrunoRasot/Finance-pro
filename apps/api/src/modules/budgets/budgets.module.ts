import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { BudgetsService } from './application/budgets.service';
import { BudgetRepository } from './application/ports/budget.repository';
import { PrismaBudgetRepository } from './infrastructure/persistence/prisma-budget.repository';
import { BudgetsController } from './presentation/budgets.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [BudgetsController],
  providers: [
    BudgetsService,
    { provide: BudgetRepository, useClass: PrismaBudgetRepository },
  ],
})
export class BudgetsModule {}
