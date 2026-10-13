import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ApiKeysService } from './api-keys.service';
import {
  ApiKeyResponseDto,
  CreatedApiKeyResponseDto,
} from './dto/api-key-response.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

// Sin @AuditLog(): ApiKeysService audita a mano para no guardar la key en
// texto plano (el interceptor guarda la respuesta completa).
@ApiTags('API Keys')
@ApiBearerAuth()
@SkipThrottle()
@Roles(UserRole.admin, UserRole.super_admin)
@Controller('api/v1/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  @ApiOperation({
    summary: 'Keys del tenant (admin) o del portal de Predia (super_admin)',
  })
  @ApiOkResponse({ type: [ApiKeyResponseDto] })
  findAll(@CurrentUser() caller: JwtPayload) {
    return this.apiKeys.findAll(caller);
  }

  @Post()
  // La respuesta trae la key en texto plano: que nada la guarde en caché.
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Crea una key; el texto plano se devuelve una sola vez',
  })
  @ApiCreatedResponse({ type: CreatedApiKeyResponseDto })
  create(@Body() dto: CreateApiKeyDto, @CurrentUser() caller: JwtPayload) {
    return this.apiKeys.create(dto, caller);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoca una key (deja de funcionar al instante)' })
  @ApiOkResponse({ type: ApiKeyResponseDto })
  revoke(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    return this.apiKeys.revoke(id, caller);
  }
}
