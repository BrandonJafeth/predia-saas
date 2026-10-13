import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiKeyScope,
  LeadSource,
  LeadStatus,
  SubscriptionStatus,
  UserStatus,
} from '@prisma/client';
import { tenantStore } from 'src/common/als/tenant.store';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import type { ApiKeyContext } from '../api-keys/api-keys.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { PublicPropertiesService } from './public-properties.service';

/**
 * Captura pública de leads (OWASP API6: flujo de negocio expuesto).
 * Defensas: rate limit estricto por key+IP (controller), honeypot,
 * validación/longitudes en el DTO, consentimiento explícito, la propiedad
 * debe estar publicada y el insert pasa por RLS del tenant destino.
 */
@Injectable()
export class PublicLeadsService {
  private readonly logger = new Logger(PublicLeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly systemPrisma: SystemPrismaService,
    private readonly properties: PublicPropertiesService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreatePublicLeadDto, key: ApiKeyContext) {
    if (dto.website) {
      // Respuesta idéntica a un envío real: no le enseñamos al bot cómo pasar.
      this.logger.warn(
        `Honeypot activado (api_key ${key.id}); lead descartado`,
      );
      return { received: true };
    }
    if (key.scope === ApiKeyScope.tenant && dto.tenant_slug) {
      throw new BadRequestException('tenant_slug solo aplica a keys de portal');
    }

    let tenantId = key.tenantId;
    let propertyId: string | null = null;
    let assignedTo: string | null = null;

    if (dto.property_slug) {
      if (key.scope === ApiKeyScope.portal && !dto.tenant_slug) {
        throw new BadRequestException(
          'Indicá tenant_slug junto con property_slug',
        );
      }
      const property = await this.properties.findVisibleForLead(
        dto.property_slug,
        dto.tenant_slug,
        key,
      );
      if (!property) throw new NotFoundException('Propiedad no encontrada');
      tenantId = property.tenant_id;
      propertyId = property.id;
      // El lead le llega directo al agente de la propiedad (si sigue activo).
      assignedTo =
        property.agent?.status === UserStatus.active ? property.agent.id : null;
    } else if (key.scope === ApiKeyScope.portal && dto.tenant_slug) {
      // Contacto a una inmobiliaria desde el portal, sin propiedad puntual.
      const tenant = await this.systemPrisma.tenant.findFirst({
        where: {
          slug: dto.tenant_slug,
          subscription_status: {
            in: [SubscriptionStatus.trial, SubscriptionStatus.active],
          },
        },
        select: { id: true },
      });
      if (!tenant) throw new NotFoundException('Inmobiliaria no encontrada');
      tenantId = tenant.id;
    }
    // Sin propiedad ni inmobiliaria: con key de portal, el lead queda en el
    // tenant de Predia (contacto general / agencias interesadas).

    // El await va DENTRO del run: una PrismaPromise es lazy y se ejecutaría
    // fuera del contexto del tenant (sin set_config → RLS rechaza el insert).
    const lead = await tenantStore.run(
      { tenantId },
      async () =>
        await this.prisma.lead.create({
          data: {
            tenant_id: tenantId,
            name: dto.name,
            email: dto.email ?? null,
            phone: dto.phone ?? null,
            notes: dto.message ?? null,
            source: LeadSource.web,
            status: LeadStatus.new,
            property_id: propertyId,
            assigned_to: assignedTo,
          },
          select: { id: true },
        }),
    );

    void this.auditLog
      .log({
        actor_id: `api_key:${key.id}`,
        actor_role: 'api_key',
        action: 'CREATE',
        entity: 'lead',
        entity_id: lead.id,
        payload: {
          source: 'public_api',
          scope: key.scope,
          property_id: propertyId,
        },
        tenant_id: tenantId,
      })
      .catch((err: unknown) => this.logger.error('Audit log failed', err));

    return { received: true };
  }
}
