import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  CATEGORIES,
  TRANSACTION_TYPES,
  type NewTransaction,
} from '../../domain/transaction';
export class CreateTransactionDto implements NewTransaction {
  @IsIn(TRANSACTION_TYPES) type!: NewTransaction['type'];
  @IsIn(CATEGORIES) category!: NewTransaction['category'];
  @IsString()
  @Matches(/^(?!0(?:\.0{1,2})?$)(0|[1-9]\d{0,15})(\.\d{1,2})?$/)
  amount!: string;
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(250)
  description = '';
  @IsUUID('4') idempotencyKey!: string;
}
