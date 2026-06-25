import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageDto } from '../../common/dto/page.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  tenant_id: true,
  email: true,
  role: true,
  status: true,
  suspended_at: true,
  first_name: true,
  last_name: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private systemPrisma: SystemPrismaService,
  ) {}

  async create(dto: CreateUserDto, tenantId: string) {
    const password_hash = await bcrypt.hash(dto.password, 12);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          first_name: dto.first_name,
          last_name: dto.last_name,
          role: dto.role,
          password_hash,
          tenant_id: tenantId,
        },
        select: USER_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'El email ya está registrado en esta inmobiliaria',
        );
      }
      throw error;
    }
  }

  async findAll(tenantId: string, pageOptionsDto: PageOptionsDto) {
    const skip = pageOptionsDto.skip;
    const limit = pageOptionsDto.limit ?? 10;

    const [data, itemCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { tenant_id: tenantId },
        select: USER_SELECT,
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: { tenant_id: tenantId },
      }),
    ]);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(data, pageMetaDto);
  }

  async findOne(id: string, tenantId: string) {
    // findFirst con tenant_id: aunque el id sea correcto, si el usuario
    // pertenece a otro tenant devuelve null → 404. Esto es el aislamiento.
    const user = await this.prisma.user.findFirst({
      where: { id, tenant_id: tenantId },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  private async findOneSystem(id: string) {
    const user = await this.systemPrisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    await this.findOne(id, tenantId); // verifica que existe y pertenece al tenant

    try {
      return await this.prisma.user.update({
        where: { id },
        data: dto,
        select: USER_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El email ya está en uso');
      }
      throw error;
    }
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // verifica que existe y pertenece al tenant
    return this.prisma.user.delete({
      where: { id },
      select: USER_SELECT,
    });
  }

  async suspend(
    id: string,
    tenantId: string,
    actorId: string,
    actorRole: UserRole,
  ) {
    const isSuperAdmin = actorRole === UserRole.super_admin;
    const user = isSuperAdmin
      ? await this.findOneSystem(id)
      : await this.findOne(id, tenantId);

    if (actorId === id) {
      throw new ForbiddenException('No podés suspender tu propia cuenta');
    }

    if (user.status === UserStatus.suspended) {
      throw new BadRequestException('El usuario ya está suspendido');
    }

    const db = isSuperAdmin ? this.systemPrisma : this.prisma;
    return db.user.update({
      where: { id },
      data: { status: UserStatus.suspended, suspended_at: new Date() },
      select: USER_SELECT,
    });
  }

  async activate(id: string, tenantId: string, actorRole: UserRole) {
    const isSuperAdmin = actorRole === UserRole.super_admin;
    const user = isSuperAdmin
      ? await this.findOneSystem(id)
      : await this.findOne(id, tenantId);

    if (user.status !== UserStatus.suspended) {
      throw new BadRequestException('El usuario no está suspendido');
    }

    const db = isSuperAdmin ? this.systemPrisma : this.prisma;
    return db.user.update({
      where: { id },
      data: { status: UserStatus.active, suspended_at: null },
      select: USER_SELECT,
    });
  }
}