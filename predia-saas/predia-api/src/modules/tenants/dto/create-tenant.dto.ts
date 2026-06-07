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
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Solo minúsculas, números y guiones. No puede empezar, terminar ni tener guiones dobles.' })
  slug!: string;
}
