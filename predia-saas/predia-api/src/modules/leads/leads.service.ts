import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadActivityType, LeadStatus, Prisma } from '@prisma/client';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { FilterLeadActivitiesDto } from './dto/filter-lead-activities.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadVisibilityService } from './lead-visibility.service';

const LEAD_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  email: true,
  phone: true,
  source: true,
  status: true,
  assigned_to: true,
  property_id: true,
  notes: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.LeadSelect;

const LEAD_DETAIL_SELECT = {
  ...LEAD_SELECT,
  activities: {
    select: {
      id: true,
      lead_id: true,
      tenant_id: true,
      type: true,
      description: true,
      created_by: true,
      created_at: true,
      creator: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: 10,
  },
} satisfies Prisma.LeadSelect;

const LEAD_ACTIVITY_SELECT = {
  id: true,
  lead_id: true,
  tenant_id: true,
  type: true,
  description: true,
  created_by: true,
  created_at: true,
  creator: {
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
    },
  },
} satisfies Prisma.LeadActivitySelect;

const VALID_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.new]: [LeadStatus.contacted, LeadStatus.lost],
  [LeadStatus.contacted]: [LeadStatus.qualified, LeadStatus.lost],
  [LeadStatus.qualified]: [LeadStatus.proposal, LeadStatus.lost],
  [LeadStatus.proposal]: [LeadStatus.negotiation, LeadStatus.lost],
  [LeadStatus.negotiation]: [LeadStatus.won, LeadStatus.lost],
  [LeadStatus.won]: [],
  [LeadStatus.lost]: [],
  [LeadStatus.archived]: [],
};

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private leadVisibility: LeadVisibilityService,
  ) {}

  async create(dto: CreateLeadDto, tenantId: string) {
    if (dto.status === LeadStatus.archived) {
      throw new BadRequestException('No se puede crear un lead archivado');
    }

    await this.validateAssignee(dto.assigned_to, tenantId);
    await this.validateProperty(dto.property_id, tenantId);

    return this.prisma.lead.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        source: dto.source,
        status: dto.status ?? LeadStatus.new,
        assigned_to: dto.assigned_to ?? null,
        property_id: dto.property_id ?? null,
        notes: dto.notes ?? null,
      },
      select: LEAD_SELECT,
    });
  }

  async findAll(filters: FilterLeadsDto, tenantId: string, caller: JwtPayload) {
    const where: Prisma.LeadWhereInput = {
      tenant_id: tenantId,
      AND: [
        { status: { not: LeadStatus.archived } },
        this.leadVisibility.getVisibleLeadWhere(caller),
        ...(filters.status !== undefined ? [{ status: filters.status }] : []),
        ...(filters.assigned_to !== undefined
          ? [{ assigned_to: filters.assigned_to }]
          : []),
        ...(filters.search
          ? [
              {
                OR: [
                  { name: { contains: filters.search, mode: 'insensitive' as const } },
                  { email: { contains: filters.search, mode: 'insensitive' as const } },
                  { phone: { contains: filters.search, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const orderBy: Prisma.LeadOrderByWithRelationInput = {
      [filters.sortBy ?? 'created_at']: filters.sortOrder ?? 'desc',
    };

    const [items, itemCount] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        select: LEAD_SELECT,
        orderBy,
        skip: filters.skip,
        take: filters.limit ?? 10,
      }),
      this.prisma.lead.count({ where }),
    ]);

    const meta = new PageMetaDto({ pageOptionsDto: filters, itemCount });
    return new PageDto(items, meta);
  }

  async findOne(id: string, tenantId: string, caller: JwtPayload) {
    const lead = await this.prisma.lead.findFirst({
      where: this.buildVisibleLeadWhere(id, tenantId, caller),
      select: LEAD_DETAIL_SELECT,
    });

    if (!lead) throw new NotFoundException('Lead no encontrado');
    return lead;
  }

  async update(
    id: string,
    dto: UpdateLeadDto,
    tenantId: string,
    caller: JwtPayload,
  ) {
    const lead = await this.findExistingLead(id, tenantId, caller);

    if (dto.status === LeadStatus.archived) {
      throw new BadRequestException(
        'Usa DELETE /leads/:id para archivar un lead',
      );
    }

    await this.validateAssignee(dto.assigned_to, tenantId);
    await this.validateProperty(dto.property_id, tenantId);

    const nextStatus = dto.status;
    const statusChanged =
      nextStatus !== undefined && nextStatus !== lead.status;

    if (statusChanged) {
      this.validateStatusTransition(lead.status, nextStatus);
    }

    // Prisma ignora claves `undefined` en update(): asignar directo
    // evita el spread condicional campo por campo.
    // Unchecked porque assigned_to/property_id son FKs escalares, no relaciones anidadas.
    const data: Prisma.LeadUncheckedUpdateInput = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      source: dto.source,
      status: dto.status,
      assigned_to: dto.assigned_to,
      property_id: dto.property_id,
      notes: dto.notes,
    };

    if (!statusChanged) {
      return this.prisma.lead.update({
        where: { id: lead.id, tenant_id: tenantId },
        data,
        select: LEAD_SELECT,
      });
    }

    const [updatedLead] = await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id: lead.id, tenant_id: tenantId },
        data,
        select: LEAD_SELECT,
      }),
      this.prisma.leadActivity.create({
        data: {
          lead_id: lead.id,
          tenant_id: tenantId,
          type: LeadActivityType.status_change,
          description: `Status changed from ${lead.status} to ${nextStatus}`,
          created_by: caller.sub,
        },
      }),
    ]);

    return updatedLead;
  }

  async remove(id: string, tenantId: string, caller: JwtPayload) {
    const lead = await this.findExistingLead(id, tenantId, caller);

    if (lead.status === LeadStatus.archived) {
      throw new NotFoundException('Lead no encontrado');
    }

    const [updatedLead] = await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id: lead.id, tenant_id: tenantId },
        data: { status: LeadStatus.archived },
        select: LEAD_SELECT,
      }),
      this.prisma.leadActivity.create({
        data: {
          lead_id: lead.id,
          tenant_id: tenantId,
          type: LeadActivityType.status_change,
          description: `Status changed from ${lead.status} to ${LeadStatus.archived}`,
          created_by: caller.sub,
        },
      }),
    ]);

    return updatedLead;
  }

  async createActivity(
    leadId: string,
    dto: CreateLeadActivityDto,
    tenantId: string,
    caller: JwtPayload,
  ) {
    const lead = await this.findExistingLead(leadId, tenantId, caller);

    return this.prisma.leadActivity.create({
      data: {
        lead_id: lead.id,
        tenant_id: tenantId,
        type: dto.type,
        description: dto.description,
        created_by: caller.sub,
      },
      select: LEAD_ACTIVITY_SELECT,
    });
  }

  async findActivities(
    leadId: string,
    filters: FilterLeadActivitiesDto,
    tenantId: string,
    caller: JwtPayload,
  ) {
    const lead = await this.findExistingLead(leadId, tenantId, caller);
    const where: Prisma.LeadActivityWhereInput = {
      lead_id: lead.id,
      tenant_id: tenantId,
    };

    const [items, itemCount] = await Promise.all([
      this.prisma.leadActivity.findMany({
        where,
        select: LEAD_ACTIVITY_SELECT,
        orderBy: { created_at: 'desc' },
        skip: filters.skip,
        take: filters.limit ?? 10,
      }),
      this.prisma.leadActivity.count({ where }),
    ]);

    const meta = new PageMetaDto({ pageOptionsDto: filters, itemCount });
    return new PageDto(items, meta);
  }

  private async findExistingLead(
    id: string,
    tenantId: string,
    caller: JwtPayload,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: this.buildVisibleLeadWhere(id, tenantId, caller),
      select: { id: true, status: true },
    });

    if (!lead) throw new NotFoundException('Lead no encontrado');
    return lead;
  }

  private buildVisibleLeadWhere(
    id: string,
    tenantId: string,
    caller: JwtPayload,
  ): Prisma.LeadWhereInput {
    return {
      id,
      tenant_id: tenantId,
      AND: [
        { status: { not: LeadStatus.archived } },
        this.leadVisibility.getVisibleLeadWhere(caller),
      ],
    };
  }

  private async validateAssignee(
    assignedTo: string | undefined,
    tenantId: string,
  ) {
    if (!assignedTo) return;

    const user = await this.prisma.user.findFirst({
      where: { id: assignedTo, tenant_id: tenantId },
      select: { id: true },
    });

    if (!user) {
      throw new ForbiddenException(
        'El agente indicado no pertenece a esta inmobiliaria',
      );
    }
  }

  private async validateProperty(
    propertyId: string | undefined,
    tenantId: string,
  ) {
    if (!propertyId) return;

    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenant_id: tenantId },
      select: { id: true },
    });

    if (!property) {
      throw new ForbiddenException(
        'La propiedad indicada no pertenece a esta inmobiliaria',
      );
    }
  }

  private validateStatusTransition(from: LeadStatus, to: LeadStatus) {
    const allowed = VALID_STATUS_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Transición de status inválida: ${from} -> ${to}`,
      );
    }
  }
}
