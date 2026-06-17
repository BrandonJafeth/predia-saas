import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';

const SYSTEM_TENANT_SLUG = 'predia-saas';

const USER_SELECT = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  role: true,
  status: true,
  created_at: true,
  updated_at: true,
  tenant: { select: { id: true, name: true, slug: true } },
} as const;

@Injectable()
export class SystemService {
  constructor(private prisma: SystemPrismaService) {}

  async findAllUsers(pageOptionsDto: PageOptionsDto) {
    const skip = pageOptionsDto.skip;
    const limit = pageOptionsDto.limit ?? 10;

    const [data, itemCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(data, pageMetaDto);
  }

  async findUsersByTenant(tenantId: string, pageOptionsDto: PageOptionsDto) {
    const skip = pageOptionsDto.skip;
    const limit = pageOptionsDto.limit ?? 10;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const [data, itemCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { tenant_id: tenantId },
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where: { tenant_id: tenantId } }),
    ]);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(data, pageMetaDto);
  }

  async createSuperAdmin(dto: CreateSuperAdminDto) {
    const tenant = await this.prisma.tenant.upsert({
      where: { slug: SYSTEM_TENANT_SLUG },
      create: { name: 'Predia SaaS', slug: SYSTEM_TENANT_SLUG },
      update: {},
      select: { id: true },
    });

    const password_hash = await bcrypt.hash(dto.password, 12);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          first_name: dto.first_name,
          last_name: dto.last_name,
          password_hash,
          role: UserRole.super_admin,
          tenant_id: tenant.id,
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          created_at: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }
}
