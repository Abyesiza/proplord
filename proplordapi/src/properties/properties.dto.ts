import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trim } from '../auth/auth.dto';

export class CreatePropertyDTO {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  currency?: string;
}

export class UpdatePropertyDTO extends PartialType(CreatePropertyDTO) {}

export class CreateUnitDTO {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  rentAmount!: number;
}

export class UpdateUnitDTO extends PartialType(CreateUnitDTO) {}
