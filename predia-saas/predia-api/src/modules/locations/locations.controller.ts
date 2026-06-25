import { Controller, Get, Header, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { LocationNodeDto, LocationResponseDto } from './dto/location-response.dto';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@Public()
@SkipThrottle()
@Controller('api/v1/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  @ApiOkResponse({ type: [LocationResponseDto] })
  findProvinces() {
    return this.locationsService.findProvinces();
  }

  @Get('tree')
  @Header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  @ApiOkResponse({ type: [LocationNodeDto] })
  getTree() {
    return this.locationsService.getTree();
  }

  @Get(':id/children')
  @Header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  @ApiOkResponse({ type: [LocationResponseDto] })
  findChildren(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findChildren(id);
  }
}
