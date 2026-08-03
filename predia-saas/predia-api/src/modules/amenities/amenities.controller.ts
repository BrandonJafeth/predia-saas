import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { AmenitiesService } from './amenities.service';
import { AmenityResponseDto } from './dto/amenity-response.dto';

@ApiTags('Amenities')
@Controller('api/v1/amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  @Public()
  @SkipThrottle()
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  @ApiOkResponse({ type: [AmenityResponseDto] })
  findAll() {
    return this.amenitiesService.findAll();
  }
}
