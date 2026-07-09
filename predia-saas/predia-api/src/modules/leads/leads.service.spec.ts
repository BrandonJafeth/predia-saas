import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  LeadActivityType,
  LeadSource,
  LeadStatus,
  UserRole,
} from '@prisma/client';
import { LeadsService } from './leads.service';

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const LEAD_ID = '550e8400-e29b-41d4-a716-446655440002';

const caller = {
  sub: USER_ID,
  tenantId: TENANT_ID,
  role: UserRole.agent,
};

const adminCaller = {
  sub: '550e8400-e29b-41d4-a716-446655440003',
  tenantId: TENANT_ID,
  role: UserRole.admin,
};

function createPrismaMock() {
  return {
    lead: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    leadActivity: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    property: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
}

describe('LeadsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: LeadsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new LeadsService(
      prisma as never,
      {
        getVisibleLeadWhere: jest.fn((currentCaller) =>
          currentCaller.role === UserRole.admin
            ? {}
            : { assigned_to: currentCaller.sub },
        ),
      },
    );
  });

  it('crea lead con status new por defecto y sin asignación', async () => {
    prisma.lead.create.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.new,
    });

    await service.create({ name: 'Lead Nuevo' }, TENANT_ID);

    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenant_id: TENANT_ID,
          name: 'Lead Nuevo',
          status: LeadStatus.new,
          assigned_to: null,
        }),
      }),
    );
  });

  it('lista leads scopeados por tenant con filtros', async () => {
    prisma.lead.findMany.mockResolvedValue([]);
    prisma.lead.count.mockResolvedValue(0);

    await service.findAll(
      {
        status: LeadStatus.contacted,
        assigned_to: USER_ID,
        page: 1,
        limit: 10,
        skip: 0,
      },
      TENANT_ID,
      caller,
    );

    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenant_id: TENANT_ID,
          AND: expect.arrayContaining([
            { status: { not: LeadStatus.archived } },
            { assigned_to: USER_ID },
            { status: LeadStatus.contacted },
            { assigned_to: USER_ID },
          ]),
        }),
      }),
    );
  });

  it('admin lista todos los leads del tenant', async () => {
    prisma.lead.findMany.mockResolvedValue([]);
    prisma.lead.count.mockResolvedValue(0);

    await service.findAll(
      { page: 1, limit: 10, skip: 0 },
      TENANT_ID,
      adminCaller,
    );

    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenant_id: TENANT_ID,
          AND: expect.arrayContaining([
            { status: { not: LeadStatus.archived } },
            {},
          ]),
        }),
      }),
    );
  });

  it('rechaza assigned_to de otro tenant', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.create(
        {
          name: 'Lead Asignado',
          assigned_to: USER_ID,
        },
        TENANT_ID,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('retorna detalle con actividades recientes', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: LEAD_ID,
      activities: [],
    });

    await service.findOne(LEAD_ID, TENANT_ID, caller);

    expect(prisma.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: LEAD_ID,
          tenant_id: TENANT_ID,
          AND: [
            { status: { not: LeadStatus.archived } },
            { assigned_to: USER_ID },
          ],
        },
        select: expect.objectContaining({
          activities: expect.objectContaining({
            orderBy: { created_at: 'desc' },
            take: 10,
            select: expect.objectContaining({
              creator: expect.any(Object),
            }),
          }),
        }),
      }),
    );
  });

  it('rechaza acceso a leads que no pertenecen al tenant', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne(LEAD_ID, TENANT_ID, caller),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('agente recibe 404 al acceder a lead de otro agente', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne(LEAD_ID, TENANT_ID, caller),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([{ assigned_to: USER_ID }]),
        }),
      }),
    );
  });

  it('rechaza transición inválida new -> won', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.new,
    });

    await expect(
      service.update(LEAD_ID, { status: LeadStatus.won }, TENANT_ID, caller),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registra activity al cambiar status', async () => {
    const updatedLead = {
      id: LEAD_ID,
      status: LeadStatus.contacted,
      source: LeadSource.web,
    };
    prisma.lead.findFirst.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.new,
    });
    prisma.lead.update.mockResolvedValue(updatedLead);
    prisma.leadActivity.create.mockResolvedValue({ id: 'activity-id' });

    const result = await service.update(
      LEAD_ID,
      { status: LeadStatus.contacted },
      TENANT_ID,
      caller,
    );

    expect(result).toBe(updatedLead);
    expect(prisma.leadActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lead_id: LEAD_ID,
          tenant_id: TENANT_ID,
          type: LeadActivityType.status_change,
          created_by: USER_ID,
        }),
      }),
    );
  });

  it('admin puede editar cualquier lead del tenant', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.contacted,
    });
    prisma.lead.update.mockResolvedValue({
      id: LEAD_ID,
      name: 'Lead editado',
    });

    await service.update(
      LEAD_ID,
      { name: 'Lead editado' },
      TENANT_ID,
      adminCaller,
    );

    expect(prisma.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: LEAD_ID,
          tenant_id: TENANT_ID,
          AND: expect.arrayContaining([{}]),
        }),
      }),
    );
  });

  it('agente recibe 404 al editar lead de otro agente', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(
      service.update(LEAD_ID, { name: 'Intento inválido' }, TENANT_ID, caller),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  it('archiva lead en DELETE y registra activity', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.contacted,
    });
    prisma.lead.update.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.archived,
    });
    prisma.leadActivity.create.mockResolvedValue({ id: 'activity-id' });

    await service.remove(LEAD_ID, TENANT_ID, caller);

    expect(prisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: LeadStatus.archived },
      }),
    );
    expect(prisma.leadActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: LeadActivityType.status_change,
        }),
      }),
    );
  });

  it('admin puede eliminar cualquier lead del tenant', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.contacted,
    });
    prisma.lead.update.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.archived,
    });
    prisma.leadActivity.create.mockResolvedValue({ id: 'activity-id' });

    await service.remove(LEAD_ID, TENANT_ID, adminCaller);

    expect(prisma.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: LEAD_ID,
          tenant_id: TENANT_ID,
          AND: expect.arrayContaining([{}]),
        }),
      }),
    );
  });

  it('agente recibe 404 al eliminar lead de otro agente', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(service.remove(LEAD_ID, TENANT_ID, caller)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.lead.update).not.toHaveBeenCalled();
    expect(prisma.leadActivity.create).not.toHaveBeenCalled();
  });

  it('crea activity con tenant y created_by automáticos', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.contacted,
    });
    prisma.leadActivity.create.mockResolvedValue({
      id: 'activity-id',
      lead_id: LEAD_ID,
      created_by: USER_ID,
    });

    await service.createActivity(
      LEAD_ID,
      {
        type: LeadActivityType.note,
        description: 'Llamar de nuevo mañana.',
      },
      TENANT_ID,
      caller,
    );

    expect(prisma.leadActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          lead_id: LEAD_ID,
          tenant_id: TENANT_ID,
          type: LeadActivityType.note,
          description: 'Llamar de nuevo mañana.',
          created_by: USER_ID,
        },
        select: expect.objectContaining({
          creator: expect.any(Object),
        }),
      }),
    );
  });

  it('lista activities paginadas por fecha descendente con creador', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: LEAD_ID,
      status: LeadStatus.contacted,
    });
    prisma.leadActivity.findMany.mockResolvedValue([]);
    prisma.leadActivity.count.mockResolvedValue(0);

    await service.findActivities(
      LEAD_ID,
      {
        page: 2,
        limit: 5,
        skip: 5,
      },
      TENANT_ID,
      caller,
    );

    expect(prisma.leadActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          lead_id: LEAD_ID,
          tenant_id: TENANT_ID,
        },
        orderBy: { created_at: 'desc' },
        skip: 5,
        take: 5,
        select: expect.objectContaining({
          creator: expect.any(Object),
        }),
      }),
    );
  });

  it('retorna 404 al crear activity si el lead no pertenece al tenant', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(
      service.createActivity(
        LEAD_ID,
        {
          type: LeadActivityType.note,
          description: 'No visible',
        },
        TENANT_ID,
        caller,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('restringe historial de activities si el agente no puede ver el lead padre', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(
      service.findActivities(
        LEAD_ID,
        { page: 1, limit: 10, skip: 0 },
        TENANT_ID,
        caller,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
