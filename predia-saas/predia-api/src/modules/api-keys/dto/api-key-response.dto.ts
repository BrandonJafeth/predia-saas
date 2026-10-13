import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyScope, ApiKeyType } from '@prisma/client';

export class ApiKeyResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ApiKeyType })
  type!: ApiKeyType;

  @ApiProperty({ enum: ApiKeyScope })
  scope!: ApiKeyScope;

  @ApiProperty({
    example: 'pk_live_A1b2C3',
    description: 'Inicio de la key, para reconocerla',
  })
  key_prefix!: string;

  @ApiProperty({ type: [String] })
  allowed_origins!: string[];

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  last_used_at!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  expires_at!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  revoked_at!: Date | null;

  @ApiProperty()
  created_at!: Date;
}

export class CreatedApiKeyResponseDto extends ApiKeyResponseDto {
  @ApiProperty({
    description:
      'La key completa. Se muestra UNA sola vez: el backend solo guarda su hash.',
  })
  plaintext_key!: string;
}
