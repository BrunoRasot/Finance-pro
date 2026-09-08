import { Transform } from 'class-transformer';
import { IsIn, IsString, Length, Matches } from 'class-validator';
import { ACCOUNT_TYPES, type AccountChanges } from '../../domain/account';

export class UpdateAccountDto implements AccountChanges {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 80)
  name!: string;

  @IsIn(ACCOUNT_TYPES)
  type!: AccountChanges['type'];

  @IsString()
  @Matches(/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/)
  openingBalance!: string;
}
