import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Inmobiliaria Norte' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'inmobiliaria-norte', description: 'Solo minúsculas, números y guiones' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Solo minúsculas, números y guiones' })
  slug!: string;
}
