import { ApiProperty } from '@nestjs/swagger';
import { CurrencyCode, LocationType, OperationType } from '@prisma/client';

// Respuestas de la API pública: solo lo que una web necesita mostrar. Nada de
// tenant_id, agent_id, emails, status internos ni flags de publicación
// (OWASP API3 — exposición excesiva de datos).

export class PublicLocationDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: LocationType }) type!: LocationType;
  @ApiProperty({
    type: [String],
    example: ['Escazú', 'San José'],
    description: 'Ancestros, del más cercano al más lejano',
  })
  parents!: string[];
}

export class PublicCategoryRefDto {
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
}

export class PublicAmenityDto {
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) icon!: string | null;
}

export class PublicImageDto {
  @ApiProperty({ description: 'Versión web (máx. 1600 px)' }) url!: string;
  @ApiProperty({ description: 'Miniatura (640 px)' }) thumbnail_url!: string;
  @ApiProperty() position!: number;
  @ApiProperty() is_cover!: boolean;
}

export class PublicAgencyDto {
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

export class PublicAgentDto {
  @ApiProperty() first_name!: string;
  @ApiProperty() last_name!: string;
}

export class PublicCoordinatesDto {
  @ApiProperty({ description: 'Redondeada a 3 decimales (~100 m)' })
  lat!: number;
  @ApiProperty({ description: 'Redondeada a 3 decimales (~100 m)' })
  lng!: number;
}

export class PublicPropertyDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: OperationType }) operation_type!: OperationType;
  @ApiProperty({ enum: CurrencyCode }) currency!: CurrencyCode;
  @ApiProperty({ example: '250000.00' }) price!: string;
  @ApiProperty({ type: String, nullable: true }) subtype!: string | null;
  @ApiProperty({ type: String, nullable: true }) lot_area_m2!: string | null;
  @ApiProperty({ type: String, nullable: true }) built_area_m2!: string | null;
  @ApiProperty({ type: () => PublicLocationDto, nullable: true })
  location!: PublicLocationDto | null;
  @ApiProperty({ type: () => PublicCategoryRefDto })
  category!: PublicCategoryRefDto;
  @ApiProperty({ type: () => PublicImageDto, nullable: true })
  cover_image!: PublicImageDto | null;
  @ApiProperty({ type: () => PublicAgencyDto }) agency!: PublicAgencyDto;
  @ApiProperty() listed_at!: Date;
}

export class PublicCategoryDetailDto extends PublicCategoryRefDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'JSON Schema de attributes (títulos y enumNames para mostrarlos)',
  })
  attribute_schema!: Record<string, unknown>;
}

export class PublicPropertyDetailDto extends PublicPropertyDto {
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: String, nullable: true }) address!: string | null;
  @ApiProperty({ type: () => PublicCoordinatesDto, nullable: true })
  coordinates!: PublicCoordinatesDto | null;
  @ApiProperty({ type: 'object', additionalProperties: true })
  attributes!: Record<string, unknown>;
  @ApiProperty({ type: () => PublicCategoryDetailDto })
  declare category: PublicCategoryDetailDto;
  @ApiProperty({ type: () => PublicImageDto, isArray: true })
  images!: PublicImageDto[];
  @ApiProperty({ type: () => PublicAmenityDto, isArray: true })
  amenities!: PublicAmenityDto[];
  @ApiProperty({ type: () => PublicAgentDto, nullable: true })
  agent!: PublicAgentDto | null;
}

export class PublicLeadAcceptedDto {
  @ApiProperty({ example: true }) received!: boolean;
}
