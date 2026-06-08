import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';

export class TenantResponseDto {
  @ApiProperty({ example: 'uuid-del-tenant' })
  id!: string;

  @ApiProperty({ example: 'Inmobiliaria Norte' })
  name!: string;

  @ApiProperty({ example: 'inmobiliaria-norte' })
  slug!: string;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.trial })
  subscription_status!: SubscriptionStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at!: Date;
}
