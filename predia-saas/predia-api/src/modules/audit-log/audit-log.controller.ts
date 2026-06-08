import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { PageOf } from 'src/common/dto/page.dto';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';


@ApiTags('Audit Log')
@ApiBearerAuth()
@Controller('api/v1/audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  // Admin del tenant — solo ve su propio log
  @Get()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Log de auditoría del tenant (solo admin)' })
  @ApiOkResponse({ type: PageOf(AuditLogResponseDto) })
  findByTenant(
    @Query() query: QueryAuditLogDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.auditLogService.findByTenant(tenantId, query);
  }

  // Superadmin — log global de todos los tenants
  @Get('system')
  @Roles(UserRole.super_admin)
  @ApiOperation({ summary: 'Log de auditoría global (solo superadmin)' })
  @ApiOkResponse({ type: PageOf(AuditLogResponseDto) })
  findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }
}