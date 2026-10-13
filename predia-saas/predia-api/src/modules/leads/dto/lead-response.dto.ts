import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource, LeadStatus } from '@prisma/client';
import { LeadActivityResponseDto } from './lead-activity-response.dto';

export class LeadAssigneeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  first_name!: string;

  @ApiProperty()
  last_name!: string;
}

export class LeadPropertyDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;
}

export class LeadResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenant_id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: LeadSource })
  source!: LeadSource;

  @ApiProperty({ enum: LeadStatus })
  status!: LeadStatus;

  @ApiPropertyOptional({ nullable: true })
  assigned_to!: string | null;

  @ApiPropertyOptional({ nullable: true })
  property_id!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  // Se resuelven en el backend: antes el front buscaba el nombre en las
  // primeras 100 entradas de /users y /properties y mostraba "Desconocida".
  @ApiPropertyOptional({ type: () => LeadAssigneeDto, nullable: true })
  assignee!: LeadAssigneeDto | null;

  @ApiPropertyOptional({ type: () => LeadPropertyDto, nullable: true })
  property!: LeadPropertyDto | null;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}

export class LeadDetailResponseDto extends LeadResponseDto {
  @ApiProperty({ type: () => LeadActivityResponseDto, isArray: true })
  activities!: LeadActivityResponseDto[];
}
