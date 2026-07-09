import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LeadStatus, UserRole } from '@prisma/client';
import { LeadVisibilityGuard } from './lead-visibility.guard';

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const LEAD_ID = '550e8400-e29b-41d4-a716-446655440002';

function createContext(role: UserRole): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          sub: USER_ID,
          tenantId: TENANT_ID,
          role,
        },
        params: { id: LEAD_ID },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('LeadVisibilityGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(() => ({ leadIdParam: 'id' })),
  } as unknown as Reflector;

  const leadVisibility = {
    getVisibleLeadWhere: jest.fn((caller) =>
      caller.role === UserRole.admin ? {} : { assigned_to: caller.sub },
    ),
  };

  let prisma: {
    lead: { findFirst: jest.Mock };
    $executeRaw: jest.Mock;
    $transaction: jest.Mock;
  };
  let guard: LeadVisibilityGuard;

  beforeEach(() => {
    prisma = {
      lead: {
        findFirst: jest.fn(),
      },
      $executeRaw: jest.fn(),
      // Simula la ejecución en batch de Prisma: corre cada operación y
      // devuelve sus resultados en orden, como el $transaction real.
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    guard = new LeadVisibilityGuard(
      reflector,
      prisma as never,
      leadVisibility,
    );
  });

  it('permite agente cuando el lead visible está asignado a él', async () => {
    prisma.lead.findFirst.mockResolvedValue({ id: LEAD_ID });

    await expect(guard.canActivate(createContext(UserRole.agent))).resolves.toBe(
      true,
    );
    expect(prisma.lead.findFirst).toHaveBeenCalledWith({
      where: {
        id: LEAD_ID,
        tenant_id: TENANT_ID,
        AND: [
          { status: { not: LeadStatus.archived } },
          { assigned_to: USER_ID },
        ],
      },
      select: { id: true },
    });
  });

  it('permite admin sin filtro por assigned_to', async () => {
    prisma.lead.findFirst.mockResolvedValue({ id: LEAD_ID });

    await expect(guard.canActivate(createContext(UserRole.admin))).resolves.toBe(
      true,
    );
    expect(prisma.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenant_id: TENANT_ID,
          AND: expect.arrayContaining([{}]),
        }),
      }),
    );
  });

  it('retorna 404 si el lead no es visible para el usuario', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(createContext(UserRole.agent))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('fija app.current_tenant_id en la misma transacción antes de consultar', async () => {
    prisma.lead.findFirst.mockResolvedValue({ id: LEAD_ID });

    await guard.canActivate(createContext(UserRole.admin));

    expect(prisma.$executeRaw).toHaveBeenCalled();
    const rawArgs = prisma.$executeRaw.mock.calls[0];
    expect(rawArgs[0].join('')).toContain('set_config');
    expect(rawArgs).toContain(TENANT_ID);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(2);
  });
});
