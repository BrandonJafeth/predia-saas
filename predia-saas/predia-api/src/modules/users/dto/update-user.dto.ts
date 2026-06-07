import { ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiPropertyOptional({ enum: [UserRole.admin, UserRole.agent], default: UserRole.agent })
  @IsOptional()
  @IsEnum([UserRole.admin, UserRole.agent], { message: 'El rol debe ser admin o agent' })
  override role?: 'admin' | 'agent';
}