import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { trim } from '../auth/auth.dto';

export const PROPERTY_TYPES = [
  'apartments',
  'rental_rooms',
  'house',
  'hostel',
  'commercial',
  'mixed_use',
  'other',
] as const;

export class PropertyDetailsDTO {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  propertyType?: (typeof PROPERTY_TYPES)[number];

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

export class CreatePropertyDTO extends PropertyDetailsDTO {
  /** Units to create with the property, named "<unitLabel> 1", "<unitLabel> 2", ... */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  unitCount?: number;

  /** Defaults to a label that fits the property type, e.g. "Room" for rental rooms. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  unitLabel?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  defaultRent?: number;
}

export class UpdatePropertyDTO extends PartialType(PropertyDetailsDTO) {}

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

export class TermClauseDTO {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body!: string;

  @IsBoolean()
  required!: boolean;
}

export class UpdateTermsDTO {
  /** Off hides the terms from tenants without losing the text. */
  @IsBoolean()
  enabled!: boolean;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TermClauseDTO)
  clauses!: TermClauseDTO[];
}
