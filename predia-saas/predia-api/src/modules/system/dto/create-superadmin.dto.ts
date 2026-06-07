import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateSuperAdminDto {
  @ApiProperty({ example: 'superadmin@predia.com' })
  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @ApiProperty({ example: 'SuperSecurePass123!', minLength: 12 })
  @IsString()
  @MinLength(12, { message: 'Mínimo 12 caracteres' })
  password!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  last_name!: string;
}
