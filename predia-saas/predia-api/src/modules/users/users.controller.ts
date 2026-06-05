import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  // UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
// import { JwtGuard } from '../../common/guards/jwt.guard';
// import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
// @UseGuards(JwtGuard) // descomentar cuando auth esté listo
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    const tenantId = 'temp-tenant-id'; // TODO: reemplazar con @CurrentTenant()
    return this.usersService.create(dto, tenantId);
  }

  @Get()
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    const tenantId = 'temp-tenant-id'; // TODO: reemplazar con @CurrentTenant()
    return this.usersService.findAll(tenantId, pageOptionsDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const tenantId = 'temp-tenant-id'; // TODO: reemplazar con @CurrentTenant()
    return this.usersService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const tenantId = 'temp-tenant-id'; // TODO: reemplazar con @CurrentTenant()
    return this.usersService.update(id, dto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const tenantId = 'temp-tenant-id'; // TODO: reemplazar con @CurrentTenant()
    return this.usersService.remove(id, tenantId);
  }
}