import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ type: Object, description: 'JSON Schema de atributos de la categoría' })
  attribute_schema!: Record<string, unknown>;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}
