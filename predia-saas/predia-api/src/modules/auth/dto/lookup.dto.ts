import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class LookupDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail()
  email!: string;
}
