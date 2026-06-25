import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Public()
@SkipThrottle()
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOkResponse({ type: [CategoryResponseDto] })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOkResponse({ type: CategoryResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
