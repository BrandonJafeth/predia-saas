import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, Matches } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bienes Raíces' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'bienes-raices', description: 'Solo minúsculas, números y guiones' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Solo minúsculas, números y guiones. No puede empezar ni terminar con guión.',
  })
  slug!: string;

  @ApiPropertyOptional({ example: 'Propiedades residenciales y comerciales' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: Object,
    description: 'JSON Schema (draft-07) para los atributos dinámicos de la categoría',
    example: { type: 'object', properties: {} },
  })
  @IsObject()
  attribute_schema!: Record<string, unknown>;
}
