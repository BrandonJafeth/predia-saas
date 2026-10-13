import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { NormalizeEmail } from 'src/common/decorators/normalize-email.decorator';

export class LookupDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @NormalizeEmail()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
