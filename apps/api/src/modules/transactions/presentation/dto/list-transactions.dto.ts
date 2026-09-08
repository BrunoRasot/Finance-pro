import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  HISTORY_CATEGORIES,
  TRANSACTION_TYPES,
  type TransactionQuery,
} from '../../domain/transaction';
export class ListTransactionsDto implements TransactionQuery {
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) offset = 0;
  @IsOptional() @IsIn(TRANSACTION_TYPES) type?: TransactionQuery['type'];
  @IsOptional()
  @IsIn(HISTORY_CATEGORIES)
  category?: TransactionQuery['category'];
  @IsOptional()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  from?: string;
  @IsOptional()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  to?: string;
}
