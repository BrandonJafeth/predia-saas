import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTenantSiteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  custom_domain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allowed_origins?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primary_color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondary_color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  font_family?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
