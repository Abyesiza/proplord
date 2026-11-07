import { Transform } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trim } from '../auth/auth.dto';

const money = { maxDecimalPlaces: 2 };

export class CreateChargeDTO {
  @IsUUID()
  memberId!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description!: string;

  @IsNumber(money)
  @Min(0.01)
  @Max(1_000_000_000)
  amount!: number;

  /** YYYY-MM-DD */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dueDate must be YYYY-MM-DD' })
  dueDate!: string;
}

export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'mobile_money',
  'card',
  'other',
] as const;

export class CreatePaymentDTO {
  @IsUUID()
  memberId!: string;

  @IsOptional()
  @IsUUID()
  chargeId?: string;

  @IsNumber(money)
  @Min(0.01)
  @Max(1_000_000_000)
  amount!: number;

  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  method?: (typeof PAYMENT_METHODS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;
}
