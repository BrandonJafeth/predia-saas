import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @SkipThrottle()
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOkResponse({ type: [CategoryResponseDto] })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  @Public()
  @SkipThrottle()
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOkResponse({ type: CategoryResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.super_admin)
  @AuditLog({ action: 'CREATE', entity: 'category' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.super_admin)
  @AuditLog({ action: 'UPDATE', entity: 'category' })
  @ApiOkResponse({ type: CategoryResponseDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.super_admin)
  @AuditLog({ action: 'DELETE', entity: 'category' })
  @ApiOkResponse({ type: CategoryResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
