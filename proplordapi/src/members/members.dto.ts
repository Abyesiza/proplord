import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { lowerTrim, trim, USERNAME_RE } from '../auth/auth.dto';

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
}

export class UpdateMemberDTO {
  /** Send null to unassign the unit. */
  @IsOptional()
  @IsUUID()
  unitId?: string | null;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
