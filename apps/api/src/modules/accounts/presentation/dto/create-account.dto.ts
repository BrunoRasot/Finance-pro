import { Transform } from 'class-transformer';
import { IsIn, IsString, Length, Matches } from 'class-validator';
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  type NewAccount,
} from '../../domain/account';

export class CreateAccountDto implements NewAccount {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 80)
  name!: string;

  @IsIn(ACCOUNT_TYPES)
  type!: NewAccount['type'];

  @IsIn(CURRENCIES)
  currency!: NewAccount['currency'];

  @IsString()
  @Matches(/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/)
  openingBalance!: string;
}
