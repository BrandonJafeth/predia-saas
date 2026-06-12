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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageOf } from '../../common/dto/page.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@SkipThrottle()
@Roles(UserRole.super_admin)
@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @AuditLog({ action: 'CREATE', entity: 'tenant' })
  @ApiCreatedResponse({ type: TenantResponseDto })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOkResponse({ type: PageOf(TenantResponseDto) })
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.tenantsService.findAll(pageOptionsDto);
  }

  @Get(':id')
  @ApiOkResponse({ type: TenantResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @AuditLog({ action: 'UPDATE', entity: 'tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @AuditLog({ action: 'DELETE', entity: 'tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.remove(id);
  }
}
