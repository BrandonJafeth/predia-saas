import { ApiProperty } from '@nestjs/swagger';

// Nombre único para evitar colisión con PropertyImageResponseDto del módulo
// property-images (que expone property_id/public_id).
export class PropertyImageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  is_cover!: boolean;

  @ApiProperty()
  created_at!: Date;
}
