import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';

const SYSTEM_TENANT_SLUG = 'predia-saas';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers(pageOptionsDto: PageOptionsDto) {
    const skip = pageOptionsDto.skip;
    const limit = pageOptionsDto.limit ?? 10;

    const [data, itemCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          created_at: true,
          updated_at: true,
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(data, pageMetaDto);
  }

  async createSuperAdmin(dto: CreateSuperAdminDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: SYSTEM_TENANT_SLUG },
    });

    if (!tenant) {
      throw new InternalServerErrorException(
        'System tenant not found. Run the seed script first.',
      );
    }

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
