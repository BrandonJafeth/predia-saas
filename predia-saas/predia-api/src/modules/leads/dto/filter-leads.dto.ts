import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LeadStatus } from '@prisma/client';
import { PageOptionsDto } from '../../../common/dto/page-options.dto';

const leadStatuses = Object.values(LeadStatus).join(', ');
const LEAD_SORTABLE_FIELDS = ['name', 'status', 'source', 'created_at'] as const;
type LeadSortableField = (typeof LEAD_SORTABLE_FIELDS)[number];

export class FilterLeadsDto extends PageOptionsDto {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus, { message: `status debe ser uno de: ${leadStatuses}` })
  status?: LeadStatus;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID del agente asignado.',
  })
  @IsOptional()
  @IsUUID(4, { message: 'assigned_to debe ser un UUID v4 válido' })
  assigned_to?: string;

  @ApiPropertyOptional({
    description: 'Búsqueda libre por nombre, email o teléfono.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: LEAD_SORTABLE_FIELDS, default: 'created_at' })
  @IsOptional()
  @IsIn(LEAD_SORTABLE_FIELDS, {
    message: `sortBy debe ser uno de: ${LEAD_SORTABLE_FIELDS.join(', ')}`,
  })
  sortBy?: LeadSortableField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: "sortOrder debe ser 'asc' o 'desc'" })
  sortOrder?: 'asc' | 'desc';
}
