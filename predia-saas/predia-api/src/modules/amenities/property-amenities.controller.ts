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
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AmenitiesService } from './amenities.service';
import { LinkAmenitiesDto } from './dto/link-amenities.dto';
import { PropertyAmenityResponseDto } from './dto/property-amenity-response.dto';

@ApiTags('Property Amenities')
@ApiBearerAuth()
@Controller('api/v1/properties/:propertyId/amenities')
export class PropertyAmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  @ApiOkResponse({ type: [PropertyAmenityResponseDto] })
  findByProperty(
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.amenitiesService.findByProperty(propertyId, tenantId);
  }

  @Post()
  @ApiOkResponse({ type: [PropertyAmenityResponseDto] })
  add(
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body() dto: LinkAmenitiesDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.amenitiesService.addAmenities(propertyId, dto, tenantId, caller);
  }

  @Delete()
  @ApiOkResponse({ type: [PropertyAmenityResponseDto] })
  remove(
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body() dto: LinkAmenitiesDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.amenitiesService.removeAmenities(propertyId, dto, tenantId, caller);
  }
}