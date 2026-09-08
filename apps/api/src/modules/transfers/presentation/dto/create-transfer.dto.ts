import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import type { NewTransfer } from '../../domain/transfer';

export class CreateTransferDto implements NewTransfer {
  @IsUUID('4')
  fromAccountId!: string;

  @IsUUID('4')
  toAccountId!: string;

  @IsString()
  @Matches(/^(?!0(?:\.0{1,2})?$)(0|[1-9]\d{0,15})(\.\d{1,2})?$/)
  amount!: string;

  @IsDateString({ strict: true })
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(250)
  description!: string;

  @IsUUID('4')
  idempotencyKey!: string;
}
