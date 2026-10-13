import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { LeadActivityType } from '@prisma/client';

// status_change no se acepta a mano: lo genera el backend al cambiar el status
// del lead. Antes la API lo aceptaba y se podía inventar un cambio de estado
// en el historial (el front solo lo escondía).
export const LOGGABLE_ACTIVITY_TYPES = [
  LeadActivityType.call,
  LeadActivityType.email,
  LeadActivityType.meeting,
  LeadActivityType.note,
] as const;
export type LoggableActivityType = (typeof LOGGABLE_ACTIVITY_TYPES)[number];

export class CreateLeadActivityDto {
  @ApiProperty({ enum: LOGGABLE_ACTIVITY_TYPES, example: LeadActivityType.note })
  @IsIn(LOGGABLE_ACTIVITY_TYPES, {
    message: `type debe ser uno de: ${LOGGABLE_ACTIVITY_TYPES.join(', ')}`,
  })
  type!: LoggableActivityType;

  @ApiProperty({ example: 'El prospecto pidió agendar una visita el sábado.' })
  @IsString({ message: 'description debe ser texto' })
  @IsNotEmpty({ message: 'description es requerido' })
  @MaxLength(2000, { message: 'description no puede superar 2000 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description!: string;
}
