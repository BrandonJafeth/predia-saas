import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageOf } from '../../common/dto/page.dto';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { FilterLeadActivitiesDto } from './dto/filter-lead-activities.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { RequireLeadVisibility } from './decorators/require-lead-visibility.decorator';
import { LeadVisibilityGuard } from './guards/lead-visibility.guard';
import { LeadActivityResponseDto } from './dto/lead-activity-response.dto';
import {
  LeadDetailResponseDto,
  LeadResponseDto,
} from './dto/lead-response.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('api/v1/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.agent)
  @AuditLog({ action: 'CREATE', entity: 'lead' })
  @ApiCreatedResponse({ type: LeadResponseDto })
  create(@Body() dto: CreateLeadDto, @CurrentTenant() tenantId: string) {
    return this.leadsService.create(dto, tenantId);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.agent)
  @ApiOkResponse({ type: PageOf(LeadResponseDto) })
  findAll(
    @Query() filters: FilterLeadsDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.leadsService.findAll(filters, tenantId, caller);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.agent)
  @RequireLeadVisibility('id')
  @UseGuards(LeadVisibilityGuard)
  @ApiOkResponse({ type: LeadDetailResponseDto })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.leadsService.findOne(id, tenantId, caller);
  }

  @Post(':leadId/activities')
  @Roles(UserRole.admin, UserRole.agent)
  @RequireLeadVisibility('leadId')
  @UseGuards(LeadVisibilityGuard)
  @AuditLog({ action: 'CREATE', entity: 'lead_activity' })
  @ApiCreatedResponse({ type: LeadActivityResponseDto })
  createActivity(
    @Param('leadId', new ParseUUIDPipe({ version: '4' })) leadId: string,
    @Body() dto: CreateLeadActivityDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.leadsService.createActivity(leadId, dto, tenantId, caller);
  }

  @Get(':leadId/activities')
  @Roles(UserRole.admin, UserRole.agent)
  @RequireLeadVisibility('leadId')
  @UseGuards(LeadVisibilityGuard)
  @ApiOkResponse({ type: PageOf(LeadActivityResponseDto) })
  findActivities(
    @Param('leadId', new ParseUUIDPipe({ version: '4' })) leadId: string,
    @Query() filters: FilterLeadActivitiesDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.leadsService.findActivities(leadId, filters, tenantId, caller);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.agent)
  @RequireLeadVisibility('id')
  @UseGuards(LeadVisibilityGuard)
  @AuditLog({ action: 'UPDATE', entity: 'lead' })
  @ApiOkResponse({ type: LeadResponseDto })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.leadsService.update(id, dto, tenantId, caller);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.agent)
  @RequireLeadVisibility('id')
  @UseGuards(LeadVisibilityGuard)
  @AuditLog({ action: 'DELETE', entity: 'lead' })
  @ApiOkResponse({ type: LeadResponseDto })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.leadsService.remove(id, tenantId, caller);
  }
}
