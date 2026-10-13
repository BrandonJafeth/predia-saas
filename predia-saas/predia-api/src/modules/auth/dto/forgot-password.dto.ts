import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { NormalizeEmail } from 'src/common/decorators/normalize-email.decorator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@correo.com' })
  @NormalizeEmail()
  @IsEmail()
  email!: string;
}
