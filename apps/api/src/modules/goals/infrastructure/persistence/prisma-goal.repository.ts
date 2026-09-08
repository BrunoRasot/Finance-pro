import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { DatabaseService } from '../../../../infrastructure/database/database.service';
import { GoalRepository } from '../../application/ports/goal.repository';
import type {
  ContributionCreation,
  GoalChanges,
  NewContribution,
  NewGoal,
  SavingsGoal,
} from '../../domain/goal';

type GoalRow = {
  id: string;
  name: string;
  currency: 'PEN' | 'USD';
  targetAmount: string;
  savedAmount: string;
  deadline: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
const cents = (value: string) => BigInt(value.replace('.', ''));
const money = (value: bigint) => {
  const sign = value < 0n ? '-' : '';
  const absolute = value < 0n ? -value : value;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`;
};
function toGoal(row: GoalRow): SavingsGoal {
  const target = cents(row.targetAmount);
  const saved = cents(row.savedAmount);
  const remaining = target - saved;
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    targetAmount: row.targetAmount,
    savedAmount: money(saved),
    remainingAmount: money(remaining > 0n ? remaining : 0n),
    progressPercent: Number((saved * 10_000n) / target) / 100,
    deadline: row.deadline?.toISOString().slice(0, 10) ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaGoalRepository extends GoalRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }
  private async find(ownerId: string, id: string): Promise<SavingsGoal | null> {
    const rows = await this.rows(ownerId, undefined, id);
    return rows[0] ? toGoal(rows[0]) : null;
  }
  private rows(ownerId: string, archived?: boolean, id?: string) {
    return this.database.client.$queryRaw<GoalRow[]>`
      SELECT g.id, g.name, g.currency, g.target_amount::text AS "targetAmount",
        COALESCE(SUM(c.amount), 0)::text AS "savedAmount", g.deadline,
        g.archived_at AS "archivedAt", g.created_at AS "createdAt", g.updated_at AS "updatedAt"
      FROM savings_goals g LEFT JOIN goal_contributions c
        ON c.goal_id = g.id AND c.owner_id = g.owner_id
      WHERE g.owner_id = ${ownerId}::uuid
        AND (${id ?? null}::uuid IS NULL OR g.id = ${id ?? null}::uuid)
        AND (${archived ?? null}::boolean IS NULL OR (g.archived_at IS NOT NULL) = ${archived ?? null}::boolean)
      GROUP BY g.id ORDER BY g.created_at DESC, g.id DESC`;
  }
  async create(ownerId: string, data: NewGoal) {
    const row = await this.database.client.savingsGoal.create({
      data: {
        ...data,
        ownerId,
        deadline: data.deadline
          ? new Date(`${data.deadline}T00:00:00.000Z`)
          : null,
      },
    });
    return (await this.find(ownerId, row.id))!;
  }
  async list(ownerId: string, archived: boolean) {
    return (await this.rows(ownerId, archived)).map(toGoal);
  }
  async update(ownerId: string, id: string, data: GoalChanges) {
    const result = await this.database.client.savingsGoal.updateMany({
      where: { ownerId, id, archivedAt: null },
      data: {
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: data.deadline
          ? new Date(`${data.deadline}T00:00:00.000Z`)
          : null,
      },
    });
    return result.count === 1 ? this.find(ownerId, id) : null;
  }
  async setArchived(ownerId: string, id: string, archived: boolean) {
    const result = await this.database.client.savingsGoal.updateMany({
      where: { ownerId, id },
      data: { archivedAt: archived ? new Date() : null },
    });
    return result.count === 1 ? this.find(ownerId, id) : null;
  }
  async contribute(
    ownerId: string,
    goalId: string,
    data: NewContribution,
  ): Promise<ContributionCreation> {
    try {
      const status = await this.database.client.$transaction(async (client) => {
        const existing = await client.goalContribution.findUnique({
          where: {
            ownerId_idempotencyKey: {
              ownerId,
              idempotencyKey: data.idempotencyKey,
            },
          },
        });
        if (existing) {
          const matches =
            existing.goalId === goalId &&
            existing.amount.equals(data.amount) &&
            existing.date.toISOString().slice(0, 10) === data.date &&
            existing.note === data.note;
          return matches ? ('duplicate' as const) : ('conflict' as const);
        }
        const goal = await client.savingsGoal.findFirst({
          where: { ownerId, id: goalId, archivedAt: null },
          select: { id: true },
        });
        if (!goal) return 'goal-not-found' as const;
        await client.goalContribution.create({
          data: {
            ...data,
            ownerId,
            goalId,
            date: new Date(`${data.date}T00:00:00.000Z`),
          },
        });
        return 'created' as const;
      });
      if (status === 'conflict' || status === 'goal-not-found')
        return { status };
      const goal = await this.find(ownerId, goalId);
      return goal ? { status, goal } : { status: 'goal-not-found' };
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      )
        throw error;
      const existing = await this.database.client.goalContribution.findUnique({
        where: {
          ownerId_idempotencyKey: {
            ownerId,
            idempotencyKey: data.idempotencyKey,
          },
        },
      });
      const goal = await this.find(ownerId, goalId);
      return existing &&
        goal &&
        existing.goalId === goalId &&
        existing.amount.equals(data.amount) &&
        existing.date.toISOString().slice(0, 10) === data.date &&
        existing.note === data.note
        ? { status: 'duplicate', goal }
        : { status: 'conflict' };
    }
  }
}
