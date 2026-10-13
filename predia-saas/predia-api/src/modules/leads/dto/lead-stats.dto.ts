import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LeadStatus } from '@prisma/client';

// Mismos filtros que el listado (sin paginación ni orden).
export class LeadStatsQueryDto {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID(4)
  assigned_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class LeadStatsResponseDto {
  @ApiProperty({ description: 'Leads visibles para el caller (sin archivados)' })
  total!: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { new: 4, contacted: 2 },
  })
  by_status!: Record<string, number>;
}
