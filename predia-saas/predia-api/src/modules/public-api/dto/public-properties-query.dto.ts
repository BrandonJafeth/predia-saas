import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyCode, OperationType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PUBLIC_SORTS = ['newest', 'price_asc', 'price_desc'] as const;
export type PublicSort = (typeof PUBLIC_SORTS)[number];

// Paginación obligatoria y con tope bajo: la API pública no ofrece "dame
// todo" (anti-scraping, OWASP API4).
export class PublicPropertiesQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit: number = 12;

  @ApiPropertyOptional({ enum: OperationType })
  @IsOptional()
  @IsEnum(OperationType)
  operation_type?: OperationType;

  @ApiPropertyOptional({
    example: 'bienes-raices',
    description: 'Slug de la categoría',
  })
  @IsOptional()
  @MaxLength(100)
  @Matches(SLUG, { message: 'category debe ser un slug' })
  category?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Provincia, cantón o distrito (incluye las ubicaciones hijas)',
  })
  @IsOptional()
  @IsUUID(4)
  location_id?: string;

  @ApiPropertyOptional({ enum: CurrencyCode })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price_min?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price_max?: number;

  @ApiPropertyOptional({ enum: PUBLIC_SORTS, default: 'newest' })
  @IsOptional()
  @IsIn(PUBLIC_SORTS)
  sort: PublicSort = 'newest';

  @ApiPropertyOptional({
    example: 'inmobiliaria-norte',
    description: 'Solo keys de portal: filtra por inmobiliaria',
  })
  @IsOptional()
  @MaxLength(100)
  @Matches(SLUG, { message: 'tenant debe ser un slug' })
  tenant?: string;
}

export class PublicPropertyDetailQueryDto {
  @ApiPropertyOptional({
    example: 'inmobiliaria-norte',
    description:
      'Obligatorio con keys de portal (el slug de la propiedad es único por inmobiliaria)',
  })
  @IsOptional()
  @MaxLength(100)
  @Matches(SLUG, { message: 'tenant debe ser un slug' })
  tenant?: string;
}
