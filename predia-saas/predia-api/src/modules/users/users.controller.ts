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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PageOf } from '../../common/dto/page.dto';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@SkipThrottle()
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.admin)
  @AuditLog({ action: 'CREATE', entity: 'user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() dto: CreateUserDto, @CurrentTenant() tenantId: string) {
    return this.usersService.create(dto, tenantId);
  }

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@CurrentUser() user: JwtPayload, @CurrentTenant() tenantId: string) {
    return this.usersService.findOne(user.sub, tenantId);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.agent)
  @ApiOkResponse({ type: PageOf(UserResponseDto) })
  findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.usersService.findAll(tenantId, pageOptionsDto);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.agent)
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.usersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.admin)
  @AuditLog({ action: 'UPDATE', entity: 'user' })
  @ApiOkResponse({ type: UserResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.usersService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  @AuditLog({ action: 'DELETE', entity: 'user' })
  @ApiNoContentResponse({ description: 'Usuario eliminado correctamente' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.usersService.remove(id, tenantId);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.admin, UserRole.super_admin)
  @AuditLog({ action: 'SUSPEND', entity: 'user' })
  @ApiOkResponse({ type: UserResponseDto })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
    @CurrentTenant() tenantId: string,
  ) {
    return this.usersService.suspend(id, tenantId, actor.sub);
  }

  @Patch(':id/activate')
  @Roles(UserRole.admin, UserRole.super_admin)
  @AuditLog({ action: 'ACTIVATE', entity: 'user' })
  @ApiOkResponse({ type: UserResponseDto })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.usersService.activate(id, tenantId);
  }
}
