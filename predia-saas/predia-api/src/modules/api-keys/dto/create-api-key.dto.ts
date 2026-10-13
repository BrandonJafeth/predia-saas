import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiKeyType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Sitio web principal', maxLength: 80 })
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2, { message: 'name debe tener al menos 2 caracteres' })
  @MaxLength(80, { message: 'name no puede superar 80 caracteres' })
  name!: string;

  @ApiProperty({
    enum: ApiKeyType,
    description:
      'publishable (pk_): para el navegador, requiere allowed_origins. secret (sk_): solo servidor, nunca en el front.',
  })
  @IsEnum(ApiKeyType, { message: 'type debe ser publishable o secret' })
  type!: ApiKeyType;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://www.miinmobiliaria.com'],
    description:
      'Orígenes exactos (https://host[:puerto]) desde los que se acepta una key publishable. Sin comodines.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Máximo 10 orígenes por key' })
  @IsString({ each: true })
  @MaxLength(253, { each: true })
  allowed_origins?: string[];

  @ApiPropertyOptional({ example: '2027-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'expires_at debe ser una fecha ISO 8601' })
  expires_at?: string;
}
