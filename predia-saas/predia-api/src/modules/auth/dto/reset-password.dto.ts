import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ minimum: 8, description: 'Mínimo 8 chars, mayúscula, número y símbolo' })
  @IsString()
  @MinLength(8, { message: 'Mínimo 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'Debe incluir al menos una mayúscula' })
  @Matches(/[0-9]/, { message: 'Debe incluir al menos un número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Debe incluir al menos un símbolo' })
  password!: string;
}
