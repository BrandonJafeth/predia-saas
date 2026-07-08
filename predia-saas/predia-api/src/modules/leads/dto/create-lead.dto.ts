import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { LeadSource, LeadStatus } from '@prisma/client';

const leadSources = Object.values(LeadSource).join(', ');
const leadStatuses = Object.values(LeadStatus).join(', ');

export class CreateLeadDto {
  @ApiProperty({ example: 'María Fernández' })
  @IsString({ message: 'name debe ser texto' })
  @IsNotEmpty({ message: 'name es requerido' })
  @MaxLength(200, { message: 'name no puede superar 200 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @ApiPropertyOptional({ example: 'maria.fernandez@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un correo válido' })
  @MaxLength(254, { message: 'email no puede superar 254 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @ApiPropertyOptional({ example: '+50688887777' })
  @IsOptional()
  @IsString({ message: 'phone debe ser texto' })
  @MaxLength(50, { message: 'phone no puede superar 50 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phone?: string;

  @ApiPropertyOptional({ enum: LeadSource, default: LeadSource.other })
  @IsOptional()
  @IsEnum(LeadSource, { message: `source debe ser uno de: ${leadSources}` })
  source?: LeadSource;

  @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.new })
  @IsOptional()
  @IsEnum(LeadStatus, { message: `status debe ser uno de: ${leadStatuses}` })
  status?: LeadStatus;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'UUID del agente asignado. Si no se envía, el service decide la asignación.',
  })
  @IsOptional()
  @IsUUID(4, { message: 'assigned_to debe ser un UUID v4 válido' })
  assigned_to?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'UUID de la propiedad de interés.',
  })
  @IsOptional()
  @IsUUID(4, { message: 'property_id debe ser un UUID v4 válido' })
  property_id?: string;

  @ApiPropertyOptional({
    example: 'Busca casa en condominio con 3 habitaciones.',
  })
  @IsOptional()
  @IsString({ message: 'notes debe ser texto' })
  @MaxLength(2000, { message: 'notes no puede superar 2000 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}
