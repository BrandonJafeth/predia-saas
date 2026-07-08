import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { LeadActivityType } from '@prisma/client';

const leadActivityTypes = Object.values(LeadActivityType).join(', ');

export class CreateLeadActivityDto {
  @ApiProperty({ enum: LeadActivityType, example: LeadActivityType.note })
  @IsEnum(LeadActivityType, {
    message: `type debe ser uno de: ${leadActivityTypes}`,
  })
  type!: LeadActivityType;

  @ApiProperty({ example: 'El prospecto pidió agendar una visita el sábado.' })
  @IsString({ message: 'description debe ser texto' })
  @IsNotEmpty({ message: 'description es requerido' })
  @MaxLength(2000, { message: 'description no puede superar 2000 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description!: string;
}
