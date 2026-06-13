import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTenantSiteDto } from './dto/create-tenant-site.dto';
import { UpdateTenantSiteDto } from './dto/update-tenant-site.dto';

const SITE_SELECT = {
  id: true,
  tenant_id: true,
  custom_domain: true,
  allowed_origins: true,
  logo_url: true,
  primary_color: true,
  secondary_color: true,
  font_family: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.TenantSiteSelect;

@Injectable()
export class TenantSitesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantSiteDto, tenantId: string) {
    try {
      return await this.prisma.tenantSite.create({
        data: { ...dto, tenant_id: tenantId },
        select: SITE_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este tenant ya tiene configuración de sitio');
      }
      throw error;
    }
  }

  async findByTenant(tenantId: string) {
    const site = await this.prisma.tenantSite.findUnique({
      where: { tenant_id: tenantId },
      select: SITE_SELECT,
    });
    if (!site) throw new NotFoundException('Configuración de sitio no encontrada');
    return site;
  }

  async update(dto: UpdateTenantSiteDto, tenantId: string) {
    await this.findByTenant(tenantId);
    return this.prisma.tenantSite.update({
      where: { tenant_id: tenantId },
      data: dto,
      select: SITE_SELECT,
    });
  }

  async remove(tenantId: string) {
    await this.findByTenant(tenantId);
    return this.prisma.tenantSite.delete({
      where: { tenant_id: tenantId },
      select: SITE_SELECT,
    });
  }
}
