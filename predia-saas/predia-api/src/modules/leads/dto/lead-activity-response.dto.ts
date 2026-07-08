import { ApiProperty } from '@nestjs/swagger';
import { LeadActivityType } from '@prisma/client';

export class LeadActivityCreatorResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  first_name!: string;

  @ApiProperty()
  last_name!: string;

  @ApiProperty()
  email!: string;
}

export class LeadActivityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  lead_id!: string;

  @ApiProperty()
  tenant_id!: string;

  @ApiProperty({ enum: LeadActivityType })
  type!: LeadActivityType;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  created_by!: string;

  @ApiProperty({ type: () => LeadActivityCreatorResponseDto })
  creator!: LeadActivityCreatorResponseDto;

  @ApiProperty()
  created_at!: Date;
}
