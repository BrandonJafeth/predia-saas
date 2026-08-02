import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AmenitiesService } from './amenities.service';
import { LinkAmenitiesDto } from './dto/link-amenities.dto';
import { CategoryAmenityResponseDto } from './dto/category-amenity-response.dto';

@ApiTags('Category Amenities')
@ApiBearerAuth()
@Controller('api/v1/categories/:categoryId/amenities')
export class CategoryAmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  @ApiOkResponse({ type: [CategoryAmenityResponseDto] })
  findByCategory(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
  ) {
    return this.amenitiesService.findByCategory(categoryId);
  }

  @Post()
  @Roles(UserRole.super_admin)
  @ApiOkResponse({ type: [CategoryAmenityResponseDto] })
  add(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @Body() dto: LinkAmenitiesDto,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.amenitiesService.addToCategory(categoryId, dto, caller);
  }

  @Delete()
  @Roles(UserRole.super_admin)
  @ApiOkResponse({ type: [CategoryAmenityResponseDto] })
  remove(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @Body() dto: LinkAmenitiesDto,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.amenitiesService.removeFromCategory(categoryId, dto, caller);
  }
}