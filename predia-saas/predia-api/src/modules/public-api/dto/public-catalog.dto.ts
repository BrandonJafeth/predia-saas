import { ApiProperty } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';
import { PublicAmenityDto } from './public-property.dto';

export class PublicCategoryDto {
  @ApiProperty({ example: 'bienes-raices' }) slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'JSON Schema (draft-07) de los atributos de la categoría',
  })
  attribute_schema!: Record<string, unknown>;
  @ApiProperty({ type: [PublicAmenityDto] }) amenities!: PublicAmenityDto[];
}

export class PublicLocationNodeDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: LocationType }) type!: LocationType;
  @ApiProperty({ type: () => [PublicLocationNodeDto] })
  children!: PublicLocationNodeDto[];
}

export class PublicBrandingDto {
  @ApiProperty({ type: String, nullable: true })
  custom_domain!: string | null;
  @ApiProperty({ type: String, nullable: true })
  logo_url!: string | null;
  @ApiProperty({ type: String, nullable: true })
  primary_color!: string | null;
  @ApiProperty({ type: String, nullable: true })
  secondary_color!: string | null;
  @ApiProperty({ type: String, nullable: true })
  font_family!: string | null;
}

export class PublicSiteDto {
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ type: () => PublicBrandingDto, nullable: true })
  branding!: PublicBrandingDto | null;
}
