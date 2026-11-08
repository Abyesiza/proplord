import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { lowerTrim, trim, USERNAME_RE } from '../auth/auth.dto';
import { FREQUENCIES, type Frequency } from '../common/periods';

export class CreateMemberDTO {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @Transform(lowerTrim)
  @Matches(USERNAME_RE, {
    message: 'username must be 3-32 chars: a-z, 0-9, _ . -',
  })
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  /** Caretakers follow up on payments for the property; they have no unit. Defaults to tenant. */
  @IsOptional()
  @IsIn(['tenant', 'caretaker'])
  role?: 'tenant' | 'caretaker';
}

export class UpdateMemberDTO {
  /** Send null to unassign the unit. */
  @IsOptional()
  @IsUUID()
  unitId?: string | null;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsIn(FREQUENCIES)
  paymentFrequency?: Frequency;

  /** Per-period amount agreed with the tenant. Send null to fall back to the unit's rent. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(1_000_000_000)
  agreedAmount?: number | null;
}
