import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantSiteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenant_id!: string;

  @ApiPropertyOptional()
  custom_domain!: string | null;

  @ApiPropertyOptional()
  allowed_origins!: string | null;

  @ApiPropertyOptional()
  logo_url!: string | null;

  @ApiPropertyOptional()
  primary_color!: string | null;

  @ApiPropertyOptional()
  secondary_color!: string | null;

  @ApiPropertyOptional()
  font_family!: string | null;

  @ApiProperty()
  is_active!: boolean;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}
