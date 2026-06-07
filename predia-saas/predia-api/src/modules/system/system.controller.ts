import { Body, Controller, Get, Post, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';
import { SystemService } from './system.service';

@ApiTags('System')
@ApiBearerAuth()
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('users')
  @Roles(UserRole.super_admin)
  @ApiOkResponse({ description: 'Lista de todos los usuarios del sistema' })
  findAllUsers(@Query() pageOptionsDto: PageOptionsDto) {
    return this.systemService.findAllUsers(pageOptionsDto);
  }

  @Post('superadmins')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.super_admin)
  @ApiCreatedResponse({ description: 'Superadmin creado correctamente' })
  createSuperAdmin(@Body() dto: CreateSuperAdminDto) {
    return this.systemService.createSuperAdmin(dto);
  }
}
