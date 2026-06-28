import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyCode, OperationType, PropertyStatus } from '@prisma/client';

export class PropertyResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenant_id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  price!: string;

  @ApiProperty({ enum: OperationType })
  operation_type!: OperationType;

  @ApiProperty({ enum: PropertyStatus })
  status!: PropertyStatus;

  @ApiProperty({ enum: CurrencyCode })
  currency!: CurrencyCode;

  @ApiPropertyOptional({ nullable: true })
  subtype!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lot_area_m2!: string | null;

  @ApiPropertyOptional({ nullable: true })
  built_area_m2!: string | null;

  @ApiPropertyOptional({ nullable: true })
  address!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lat!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lng!: string | null;

  @ApiPropertyOptional({ nullable: true })
  location_id!: string | null;

  @ApiProperty()
  category_id!: string;

  @ApiPropertyOptional({ nullable: true })
  agent_id!: string | null;

  @ApiProperty({ type: Object })
  attributes!: Record<string, unknown>;

  @ApiProperty()
  is_published!: boolean;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}
