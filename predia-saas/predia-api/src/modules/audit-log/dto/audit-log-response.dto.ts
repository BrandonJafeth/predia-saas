import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ example: 'uuid-aqui' })
  id!: string;

  @ApiProperty({ example: 'uuid-del-usuario' })
  actor_id!: string;

  @ApiPropertyOptional({ example: 'Juan Pérez', nullable: true })
  actor_name!: string | null;

  @ApiPropertyOptional({ example: 'juan@predia.com', nullable: true })
  actor_email!: string | null;

  @ApiProperty({ example: 'admin' })
  actor_role!: string;

  @ApiProperty({ example: 'DELETE' })
  action!: string;

  @ApiProperty({ example: 'property' })
  entity!: string;

  @ApiProperty({ example: 'uuid-de-la-propiedad' })
  entity_id!: string;

  @ApiProperty({ example: { before: {}, after: {} } })
  payload!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'uuid-del-tenant', nullable: true })
  tenant_id!: string | null;

  @ApiPropertyOptional({ example: 'Acme Corp', nullable: true })
  tenant_name!: string | null;

  @ApiPropertyOptional({ example: 'acme-corp', nullable: true })
  tenant_slug!: string | null;

  @ApiProperty()
  created_at!: Date;
}
