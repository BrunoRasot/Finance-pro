import { IsIn, Matches } from 'class-validator';
import {
  BUDGET_CATEGORIES,
  type BudgetCategory,
  type BudgetCurrency,
  type BudgetInput,
} from '../../domain/budget';

export class BudgetMonthDto {
  @Matches(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/)
  month!: string;
}

export class SaveBudgetDto implements BudgetInput {
  @Matches(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/)
  month!: string;

  @IsIn(['PEN', 'USD'])
  currency!: BudgetCurrency;

  @IsIn(BUDGET_CATEGORIES)
  category!: BudgetCategory;

  @Matches(/^(?!0(?:\.0{1,2})?$)(0|[1-9]\d{0,15})(\.\d{1,2})?$/)
  amount!: string;
}
