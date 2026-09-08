import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { GoalsService } from './application/goals.service';
import { GoalRepository } from './application/ports/goal.repository';
import { PrismaGoalRepository } from './infrastructure/persistence/prisma-goal.repository';
import { GoalsController } from './presentation/goals.controller';
@Module({
  imports: [DatabaseModule],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    { provide: GoalRepository, useClass: PrismaGoalRepository },
  ],
})
export class GoalsModule {}
