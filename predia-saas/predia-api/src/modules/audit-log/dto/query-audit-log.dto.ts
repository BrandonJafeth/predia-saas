import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';

export class QueryAuditLogDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'user', description: 'Entidad afectada' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ example: 'DELETE', description: 'Tipo de acción' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'UUID del actor (usuario que ejecutó la acción)' })
  @IsOptional()
  @IsUUID()
  actor_id?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Desde esta fecha (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Hasta esta fecha (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
