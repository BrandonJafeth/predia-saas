import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyScope } from '@prisma/client';
import { ApiKeyAuth } from 'src/common/decorators/api-key-auth.decorator';
import { ApiKeyScopes } from 'src/common/decorators/api-key-scopes.decorator';
import { CurrentApiKey } from 'src/common/decorators/current-api-key.decorator';
import { PageOf } from 'src/common/dto/page.dto';
import type { ApiKeyContext } from '../api-keys/api-keys.service';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import {
  PublicCategoryDto,
  PublicLocationNodeDto,
  PublicSiteDto,
} from './dto/public-catalog.dto';
import {
  PublicPropertiesQueryDto,
  PublicPropertyDetailQueryDto,
} from './dto/public-properties-query.dto';
import {
  PublicLeadAcceptedDto,
  PublicPropertyDetailDto,
  PublicPropertyDto,
} from './dto/public-property.dto';
import { PublicCatalogService } from './public-catalog.service';
import { PublicLeadsService } from './public-leads.service';
import { PublicPropertiesService } from './public-properties.service';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * API pública v1 — la consumen la web de Predia (keys de portal) y las webs
 * white-label de cada inmobiliaria (keys de tenant). Solo lectura de lo
 * publicado + alta de leads. Versionada en la URL (OWASP API9: inventario).
 */
@ApiTags('Public API')
@ApiKeyAuth()
@Controller('public/v1')
export class PublicApiController {
  constructor(
    private readonly properties: PublicPropertiesService,
    private readonly catalog: PublicCatalogService,
    private readonly leads: PublicLeadsService,
  ) {}

  @Get('properties')
  @Header('Cache-Control', 'private, max-age=60')
  @ApiOperation({
    summary: 'Propiedades publicadas (paginado, máx. 50 por página)',
  })
  @ApiOkResponse({ type: PageOf(PublicPropertyDto) })
  findProperties(
    @Query() query: PublicPropertiesQueryDto,
    @CurrentApiKey() key: ApiKeyContext,
  ) {
    return this.properties.findAll(query, key);
  }

  @Get('properties/:slug')
  @Header('Cache-Control', 'private, max-age=60')
  @ApiOperation({ summary: 'Detalle de una propiedad publicada' })
  @ApiOkResponse({ type: PublicPropertyDetailDto })
  findProperty(
    @Param('slug') slug: string,
    @Query() query: PublicPropertyDetailQueryDto,
    @CurrentApiKey() key: ApiKeyContext,
  ) {
    if (!SLUG.test(slug) || slug.length > 200) {
      throw new NotFoundException('Propiedad no encontrada');
    }
    return this.properties.findBySlug(slug, query, key);
  }

  @Get('categories')
  @Header('Cache-Control', 'private, max-age=300')
  @ApiOperation({ summary: 'Categorías con su attribute_schema y amenidades' })
  @ApiOkResponse({ type: [PublicCategoryDto] })
  categories() {
    return this.catalog.categories();
  }

  @Get('locations')
  @Header('Cache-Control', 'private, max-age=86400')
  @ApiOperation({
    summary:
      'Árbol de ubicaciones de Costa Rica (provincia → cantón → distrito)',
  })
  @ApiOkResponse({ type: [PublicLocationNodeDto] })
  locations() {
    return this.catalog.locationTree();
  }

  @Get('site')
  @ApiKeyScopes(ApiKeyScope.tenant)
  @Header('Cache-Control', 'private, max-age=300')
  @ApiOperation({
    summary: 'Nombre y branding de la web white-label (keys de tenant)',
  })
  @ApiOkResponse({ type: PublicSiteDto })
  site(@CurrentApiKey() key: ApiKeyContext) {
    return this.catalog.site(key);
  }

  @Post('leads')
  @HttpCode(HttpStatus.ACCEPTED)
  // Flujo sensible (spam de formularios): 5 envíos cada 10 min por key+IP.
  @Throttle({ public: { limit: 5, ttl: 10 * 60_000 } })
  @ApiOperation({
    summary:
      'Formulario de contacto: crea un lead en la inmobiliaria correspondiente',
  })
  @ApiAcceptedResponse({ type: PublicLeadAcceptedDto })
  createLead(
    @Body() dto: CreatePublicLeadDto,
    @CurrentApiKey() key: ApiKeyContext,
  ) {
    return this.leads.create(dto, key);
  }
}
