import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Inmobiliaria Norte' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'inmobiliaria-norte', description: 'Solo minúsculas, números y guiones' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Solo minúsculas, números y guiones. No puede empezar, terminar ni tener guiones dobles.' })
  slug!: string;

  @ApiPropertyOptional({ example: 'asesor@inmobiliaria.com' })
  @IsOptional()
  @IsEmail()
  advisor_email?: string;

  @ApiPropertyOptional({ example: 'password123', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  advisor_password?: string;

  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  advisor_first_name?: string;

  @ApiPropertyOptional({ example: 'Mendoza' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  advisor_last_name?: string;
}
