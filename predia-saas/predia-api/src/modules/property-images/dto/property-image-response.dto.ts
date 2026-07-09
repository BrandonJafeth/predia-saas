import { ApiProperty } from '@nestjs/swagger';

export class PropertyImageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  property_id!: string;

  @ApiProperty({ description: 'secure_url devuelta por Cloudinary' })
  url!: string;

  @ApiProperty({ description: 'public_id de Cloudinary — usado para destroy() al eliminar' })
  public_id!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  is_cover!: boolean;

  @ApiProperty()
  created_at!: Date;
}
