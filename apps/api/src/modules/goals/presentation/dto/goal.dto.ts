import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { GoalChanges, NewContribution, NewGoal } from '../../domain/goal';

const MONEY = /^(?!0(?:\.0{1,2})?$)(0|[1-9]\d{0,15})(\.\d{1,2})?$/;
const DATE = /^(?!0000)\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ListGoalsDto {
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status: 'ACTIVE' | 'ARCHIVED' = 'ACTIVE';
}

export class CreateGoalDto implements NewGoal {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsIn(['PEN', 'USD'])
  currency!: NewGoal['currency'];

  @Matches(MONEY)
  targetAmount!: string;

  @IsOptional()
  @Matches(DATE)
  @IsDateString({ strict: true })
  deadline!: string | null;
}

export class UpdateGoalDto implements GoalChanges {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @Matches(MONEY)
  targetAmount!: string;

  @IsOptional()
  @Matches(DATE)
  @IsDateString({ strict: true })
  deadline!: string | null;
}

export class CreateContributionDto implements NewContribution {
  @Matches(MONEY)
  amount!: string;

  @Matches(DATE)
  @IsDateString({ strict: true })
  date!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(250)
  note!: string;

  @IsUUID('4')
  idempotencyKey!: string;
}
