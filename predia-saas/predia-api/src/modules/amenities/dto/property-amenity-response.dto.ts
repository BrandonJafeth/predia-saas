import { ApiProperty } from '@nestjs/swagger';
import { AmenityResponseDto } from './amenity-response.dto';

export class PropertyAmenityResponseDto {
  @ApiProperty()
  property_id!: string;

  @ApiProperty()
  amenity_id!: string;

  @ApiProperty({ type: () => AmenityResponseDto })
  amenity!: AmenityResponseDto;
}