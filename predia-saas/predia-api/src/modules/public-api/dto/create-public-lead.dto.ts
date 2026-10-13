import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { NormalizeEmail } from 'src/common/decorators/normalize-email.decorator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Formulario público de contacto (web white-label o portal de Predia).
 * Todo texto llega como texto plano: el CRM lo muestra escapado (React), no
 * se interpreta HTML en ningún lado.
 */
export class CreatePublicLeadDto {
  @ApiProperty({ example: 'María Fernández', minLength: 2, maxLength: 120 })
  @IsString()
  @Transform(trim)
  @MinLength(2, { message: 'Ingresá tu nombre' })
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @ValidateIf((o: CreatePublicLeadDto) => o.email !== undefined || !o.phone)
  @NormalizeEmail()
  @IsEmail({}, { message: 'Ingresá un correo válido (o un teléfono)' })
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: '+506 8888 7777' })
  @ValidateIf((o: CreatePublicLeadDto) => o.phone !== undefined || !o.email)
  @IsString()
  @Transform(trim)
  @Matches(/^\+?[0-9 ()-]{7,20}$/, {
    message: 'Ingresá un teléfono válido (o un correo)',
  })
  phone?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({
    example: 'casa-en-santa-ana',
    description: 'Propiedad consultada',
  })
  @IsOptional()
  @MaxLength(200)
  @Matches(SLUG, { message: 'property_slug debe ser un slug' })
  property_slug?: string;

  @ApiPropertyOptional({
    example: 'inmobiliaria-norte',
    description: 'Solo keys de portal: inmobiliaria dueña de property_slug',
  })
  @IsOptional()
  @MaxLength(100)
  @Matches(SLUG, { message: 'tenant_slug debe ser un slug' })
  tenant_slug?: string;

  // Ley 8968 (protección de datos, CR): el visitante acepta explícitamente
  // que lo contacten. El formulario debe mostrar el texto de consentimiento.
  @ApiProperty({
    example: true,
    description: 'Consentimiento para ser contactado',
  })
  @IsBoolean()
  @Equals(true, { message: 'Necesitamos tu consentimiento para contactarte' })
  consent!: boolean;

  // Honeypot: campo oculto para personas. Un bot que lo completa recibe la
  // misma respuesta 202 pero el lead se descarta.
  @ApiPropertyOptional({ description: 'Dejar vacío (anti-spam)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
