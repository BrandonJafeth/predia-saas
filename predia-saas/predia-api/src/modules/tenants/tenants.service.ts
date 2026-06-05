import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Tenant } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const data = {
      ...dto,
      slug: dto.slug.toLowerCase().trim(),
    };

    try {
      return await this.prisma.tenant.create({
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El slug ya está en uso');
      }
      throw error;
    }
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Tenant>> {
    const skip = pageOptionsDto.skip;
    const limit = pageOptionsDto.limit ?? 10;

    const [data, itemCount] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
      }),
      this.prisma.tenant.count(),
    ]);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(data, pageMetaDto);
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async update(id: string, updatedto: UpdateTenantDto) {
    if (updatedto.slug) {
      const exist = await this.prisma.tenant.findUnique({
        where: { slug: updatedto.slug },
      });
      if (exist && exist.id !== id) {
        throw new ConflictException('El slug ya está en uso');
      }
    }

    try {
      return await this.prisma.tenant.update({
        where: { id },
        data: updatedto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Tenant no encontrado`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.tenant.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Tenant no encontrado');
      }
      throw error;
    }
  }
}
