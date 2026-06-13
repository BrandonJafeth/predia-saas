import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateTenantSiteDto } from './dto/create-tenant-site.dto';
import { TenantSiteResponseDto } from './dto/tenant-site-response.dto';
import { UpdateTenantSiteDto } from './dto/update-tenant-site.dto';
import { TenantSitesService } from './tenant-sites.service';

@ApiTags('Tenant Sites')
@ApiBearerAuth()
@Controller('api/v1/tenant-sites')
export class TenantSitesController {
  constructor(private readonly tenantSitesService: TenantSitesService) {}

  @Post()
  @Roles(UserRole.admin)
  @AuditLog({ action: 'CREATE', entity: 'tenant_site' })
  @ApiCreatedResponse({ type: TenantSiteResponseDto })
  create(@Body() dto: CreateTenantSiteDto, @CurrentTenant() tenantId: string) {
    return this.tenantSitesService.create(dto, tenantId);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.agent)
  @ApiOkResponse({ type: TenantSiteResponseDto })
  findOne(@CurrentTenant() tenantId: string) {
    return this.tenantSitesService.findByTenant(tenantId);
  }

  @Patch()
  @Roles(UserRole.admin)
  @AuditLog({ action: 'UPDATE', entity: 'tenant_site' })
  @ApiOkResponse({ type: TenantSiteResponseDto })
  update(@Body() dto: UpdateTenantSiteDto, @CurrentTenant() tenantId: string) {
    return this.tenantSitesService.update(dto, tenantId);
  }

  @Delete()
  @Roles(UserRole.admin)
  @AuditLog({ action: 'DELETE', entity: 'tenant_site' })
  @ApiNoContentResponse({ description: 'Configuración de sitio eliminada' })
  remove(@CurrentTenant() tenantId: string) {
    return this.tenantSitesService.remove(tenantId);
  }
}
