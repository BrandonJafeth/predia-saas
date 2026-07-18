import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PropertyImageResponseDto } from './dto/property-image-response.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { PropertyImagesService } from './property-images.service';

@ApiTags('Property Images')
@ApiBearerAuth()
@Controller('api/v1/properties/:propertyId/images')
export class PropertyImagesController {
  constructor(private readonly propertyImagesService: PropertyImagesService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.agent)
  @UseInterceptors(FileInterceptor('file'))
  @AuditLog({ action: 'CREATE', entity: 'property_image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: PropertyImageResponseDto })
  create(
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.propertyImagesService.create(propertyId, tenantId, caller, file);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.admin, UserRole.agent)
  @AuditLog({ action: 'DELETE', entity: 'property_image' })
  @ApiNoContentResponse()
  remove(
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.propertyImagesService.remove(propertyId, imageId, tenantId, caller);
  }

  @Patch(':imageId/cover')
  @Roles(UserRole.admin, UserRole.agent)
  @AuditLog({ action: 'UPDATE', entity: 'property_image' })
  @ApiOkResponse({ type: PropertyImageResponseDto })
  setCover(
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.propertyImagesService.setCover(propertyId, imageId, tenantId, caller);
  }

  @Patch('reorder')
  @Roles(UserRole.admin, UserRole.agent)
  @AuditLog({ action: 'UPDATE', entity: 'property_image' })
  @ApiOkResponse({ type: PropertyImageResponseDto, isArray: true })
  reorder(
    @Param('propertyId', new ParseUUIDPipe({ version: '4' })) propertyId: string,
    @Body() dto: ReorderImagesDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.propertyImagesService.reorder(propertyId, dto, tenantId, caller);
  }
}
