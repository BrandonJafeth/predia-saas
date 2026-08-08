import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';
import { PropertyAmenityResponseDto } from '../../amenities/dto/property-amenity-response.dto';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { PropertyImageDto } from './property-image.dto';
import { PropertyResponseDto } from './property-response.dto';

export class PropertyLocationDto {
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
}

export class PropertyAgentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  first_name!: string;

  @ApiProperty()
  last_name!: string;

  @ApiProperty()
  email!: string;
}

export class PropertyDetailResponseDto extends PropertyResponseDto {
  @ApiPropertyOptional({ type: () => PropertyLocationDto, nullable: true })
  location!: PropertyLocationDto | null;

  @ApiProperty({ type: () => CategoryResponseDto })
  category!: CategoryResponseDto;

  @ApiPropertyOptional({ type: () => PropertyAgentDto, nullable: true })
  agent!: PropertyAgentDto | null;

  @ApiProperty({ type: () => [PropertyImageDto] })
  images!: PropertyImageDto[];

  @ApiProperty({ type: () => [PropertyAmenityResponseDto] })
  amenities!: PropertyAmenityResponseDto[];

  @ApiProperty({ description: 'Límite de imágenes del plan del tenant' })
  max_images_per_property!: number;
}
