import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const lowerTrim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;

export class SignupDTO {
  @Transform(lowerTrim)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;
}

export class LoginDTO {
  /** Email address or username. */
  @Transform(lowerTrim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}

export class RefreshDTO {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
