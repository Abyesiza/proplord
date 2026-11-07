import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { lowerTrim, trim } from '../auth/auth.dto';

export class CreateInvitationDTO {
  @Transform(lowerTrim)
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;
}

export class AcceptInvitationDTO {
  @IsString()
  @IsNotEmpty()
  token!: string;

  /** Required only when the invitee has no account yet. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName?: string;
}
