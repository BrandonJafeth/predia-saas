import { ApiProperty } from '@nestjs/swagger';
import { AmenityResponseDto } from './amenity-response.dto';

export class CategoryAmenityResponseDto {
  @ApiProperty()
  category_id!: string;

  @ApiProperty()
  amenity_id!: string;

  @ApiProperty({ type: () => AmenityResponseDto })
  amenity!: AmenityResponseDto;
}