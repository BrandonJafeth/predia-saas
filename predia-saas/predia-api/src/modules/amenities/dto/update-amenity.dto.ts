import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAmenityDto } from './create-amenity.dto';

export class UpdateAmenityDto extends PartialType(CreateAmenityDto) {
  @ApiPropertyOptional({
    description: 'Reactivar una amenidad previamente eliminada (soft-delete).',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
