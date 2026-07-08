import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource, LeadStatus } from '@prisma/client';
import { LeadActivityResponseDto } from './lead-activity-response.dto';

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

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}

export class LeadDetailResponseDto extends LeadResponseDto {
  @ApiProperty({ type: () => LeadActivityResponseDto, isArray: true })
  activities!: LeadActivityResponseDto[];
}
