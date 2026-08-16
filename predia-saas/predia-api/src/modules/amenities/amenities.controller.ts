import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AmenitiesService } from './amenities.service';
import { AmenityResponseDto } from './dto/amenity-response.dto';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';

@ApiTags('Amenities')
@Controller('api/v1/amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  @Public()
  @SkipThrottle()
  // no-cache (no max-age): fuerza revalidar con el server en cada request en
  // vez de confiar ciegamente en una copia local por 1h. Sigue siendo barato
  // porque Express ya manda ETag — el navegador solo re-descarga si cambió.
  // Con max-age=3600 una amenidad creada ahora tarda hasta 1h en aparecer
  // para cualquiera que ya haya cacheado la lista vacía/vieja.
  @Header('Cache-Control', 'public, no-cache')
  @ApiOkResponse({ type: [AmenityResponseDto] })
  findAll() {
    return this.amenitiesService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.super_admin)
  @AuditLog({ action: 'CREATE', entity: 'amenity' })
  @ApiCreatedResponse({ type: AmenityResponseDto })
  create(@Body() dto: CreateAmenityDto, @CurrentUser() caller: JwtPayload) {
    return this.amenitiesService.create(dto, caller);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.super_admin)
  @AuditLog({ action: 'UPDATE', entity: 'amenity' })
  @ApiOkResponse({ type: AmenityResponseDto })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAmenityDto,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.amenitiesService.update(id, dto, caller);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @Roles(UserRole.super_admin)
  @AuditLog({ action: 'DELETE', entity: 'amenity' })
  @ApiNoContentResponse()
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.amenitiesService.remove(id, caller);
  }
}
