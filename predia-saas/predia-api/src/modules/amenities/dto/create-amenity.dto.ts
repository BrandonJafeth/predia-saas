import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAmenityDto {
  @ApiProperty({ example: 'Piscina', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2, { message: 'name debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'name no puede superar 100 caracteres' })
  name!: string;

  @ApiPropertyOptional({
    example: 'piscina',
    description: 'Identificador para el set de íconos del frontend. Si se omite, se deriva del slug.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'icon no puede superar 100 caracteres' })
  icon?: string;
}
