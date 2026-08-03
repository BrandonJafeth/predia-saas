import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AmenityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  icon!: string | null;

  @ApiProperty()
  is_active!: boolean;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}
