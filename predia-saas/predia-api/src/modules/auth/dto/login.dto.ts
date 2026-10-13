import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { NormalizeEmail } from 'src/common/decorators/normalize-email.decorator';

export class LoginDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @NormalizeEmail()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'uuid-del-tenant' })
  @IsUUID()
  tenantId!: string;
}
