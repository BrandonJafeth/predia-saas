import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageOf } from '../../common/dto/page.dto';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FindPropertiesDto } from './dto/find-properties.dto';
import { PropertyResponseDto } from './dto/property-response.dto';
import { PropertiesService } from './properties.service';

@ApiTags('Properties')
@ApiBearerAuth()
@Controller('api/v1/properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @Roles(UserRole.admin, UserRole.agent)
  @ApiOkResponse({ type: PageOf(PropertyResponseDto) })
  findAll(
    @Query() filters: FindPropertiesDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.propertiesService.findAll(filters, tenantId);
  }

  @Post()
  @Roles(UserRole.admin, UserRole.agent)
  @AuditLog({ action: 'CREATE', entity: 'property' })
  @ApiCreatedResponse({ type: PropertyResponseDto })
  create(
    @Body() dto: CreatePropertyDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.propertiesService.create(dto, tenantId, caller);
  }
}
