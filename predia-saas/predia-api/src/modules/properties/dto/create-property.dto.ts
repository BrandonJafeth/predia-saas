import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CurrencyCode, OperationType } from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Casa en Santa Ana', minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3, { message: 'title debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'title no puede superar 200 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @ApiPropertyOptional({ example: 'Hermosa casa de dos pisos en condominio privado' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiProperty({ example: 250000, description: 'Precio en la moneda indicada en currency' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price debe ser un número con máximo 2 decimales' })
  @IsPositive({ message: 'price debe ser mayor a 0' })
  price!: number;

  @ApiProperty({ enum: OperationType, example: OperationType.sale })
  @IsEnum(OperationType, { message: 'operation_type debe ser sale, rent o lease' })
  operation_type!: OperationType;

  @ApiPropertyOptional({ enum: CurrencyCode, default: CurrencyCode.CRC })
  @IsOptional()
  @IsEnum(CurrencyCode, { message: 'currency debe ser CRC o USD' })
  currency?: CurrencyCode;

  @ApiPropertyOptional({
    example: 'casa',
    description: 'Subtipo según la categoría (e.g. casa, apartamento)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'subtype no puede superar 100 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  subtype?: string;

  @ApiPropertyOptional({ example: 500.5, description: 'Área del lote en m²' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'lot_area_m2 debe ser un número' })
  @IsPositive({ message: 'lot_area_m2 debe ser mayor a 0' })
  lot_area_m2?: number;

  @ApiPropertyOptional({ example: 180.0, description: 'Área construida en m²' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'built_area_m2 debe ser un número' })
  @IsPositive({ message: 'built_area_m2 debe ser mayor a 0' })
  built_area_m2?: number;

  @ApiPropertyOptional({ example: 'De la iglesia 200m norte, casa esquinera' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'address no puede superar 500 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address?: string;

  // lat y lng deben enviarse juntos o no enviarse.
  // @ValidateIf activa los decoradores si cualquiera de los dos está presente.
  @ApiPropertyOptional({ example: 9.9281, description: 'Latitud decimal. Requiere lng.' })
  @ValidateIf((o: CreatePropertyDto) => o.lat !== undefined || o.lng !== undefined)
  @IsDefined({ message: 'lat es requerido cuando se envía lng' })
  @IsNumber({}, { message: 'lat debe ser un número' })
  @Min(-90, { message: 'lat debe ser >= -90' })
  @Max(90, { message: 'lat debe ser <= 90' })
  lat?: number;

  @ApiPropertyOptional({ example: -84.0907, description: 'Longitud decimal. Requiere lat.' })
  @ValidateIf((o: CreatePropertyDto) => o.lat !== undefined || o.lng !== undefined)
  @IsDefined({ message: 'lng es requerido cuando se envía lat' })
  @IsNumber({}, { message: 'lng debe ser un número' })
  @Min(-180, { message: 'lng debe ser >= -180' })
  @Max(180, { message: 'lng debe ser <= 180' })
  lng?: number;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID de la ubicación. Opcional en borrador.',
  })
  @IsOptional()
  @IsUUID(4, { message: 'location_id debe ser un UUID v4 válido' })
  location_id?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'Solo admin. UUID del agente a asignar. Ignorado si el caller es agent (se autoasigna).',
  })
  @IsOptional()
  @IsUUID(4, { message: 'agent_id debe ser un UUID v4 válido' })
  agent_id?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID de la categoría',
  })
  @IsUUID(4, { message: 'category_id debe ser un UUID v4 válido' })
  category_id!: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Atributos dinámicos según el attribute_schema de la categoría',
  })
  @IsOptional()
  @IsObject({ message: 'attributes debe ser un objeto JSON' })
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: 'is_published debe ser un booleano' })
  is_published?: boolean;
}
