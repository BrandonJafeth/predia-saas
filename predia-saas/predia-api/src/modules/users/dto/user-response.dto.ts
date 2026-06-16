import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'cuid_abc123' })
  id!: string;

  @ApiProperty({ example: 'cuid_tenant456' })
  tenant_id!: string;

  @ApiProperty({ example: 'usuario@ejemplo.com' })
  email!: string;

  @ApiProperty({ example: 'Juan' })
  first_name!: string;

  @ApiProperty({ example: 'Pérez' })
  last_name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.agent })
  role!: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.active })
  status!: UserStatus;

  @ApiPropertyOptional({ example: null })
  suspended_at!: Date | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at!: Date;
}
