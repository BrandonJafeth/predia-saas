import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';

export interface LocationNode {
  id: string;
  name: string;
  code: string;
  type: LocationType;
  parent_id: string | null;
  created_at: Date;
  children: LocationNode[];
}

export class LocationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ enum: LocationType })
  type!: LocationType;

  @ApiPropertyOptional({ nullable: true })
  parent_id!: string | null;

  @ApiProperty()
  created_at!: Date;
}

export class LocationNodeDto extends LocationResponseDto {
  @ApiProperty({ type: () => [LocationNodeDto] })
  children!: LocationNodeDto[];
}
