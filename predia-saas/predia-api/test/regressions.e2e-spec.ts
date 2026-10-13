import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  LeadStatus,
  OperationType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { tenantStore } from '../src/common/als/tenant.store';
import { JwtPayload } from '../src/modules/auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../src/prisma/prisma.service';
import { SystemPrismaService } from '../src/prisma/system-prisma.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as typeof import('cookie-parser');

const PASSWORD = 'Password123!';

/**
 * Regresiones de la auditoría de bugs: cada test reproduce un fallo que
 * existió (500s, transacciones no atómicas, rate-limit que no aplicaba,
 * sesiones no revocables...) y fija el comportamiento correcto.
 */
describe('Regresiones (e2e)', () => {
  let app: INestApplication<App>;
  let sys: SystemPrismaService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const sfx = randomUUID().slice(0, 8);
  const ids = {
    tenants: [] as string[],
    categories: [] as string[],
    amenities: [] as string[],
    users: [] as string[],
  };
  let createdSystemTenant = false;

  let tenantA: { id: string };
  let tenantB: { id: string };
  let adminA: { id: string; email: string; token: string };
  let agentA: { id: string; email: string; token: string };
  let superAdmin: { id: string; token: string };
  let category: { id: string };

  const server = () => app.getHttpServer();
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function createUser(
    tenantId: string,
    role: UserRole,
    label: string,
    status: UserStatus = UserStatus.active,
  ) {
    const email = `${label}-${sfx}@e2e.test`;
    const user = await sys.user.create({
      data: {
        tenant_id: tenantId,
        email,
        password_hash: await bcrypt.hash(PASSWORD, 4),
        role,
        status,
        first_name: label,
        last_name: 'E2E',
      },
    });
    ids.users.push(user.id);
    const token = jwt.sign({
      sub: user.id,
      tenantId,
      role,
    } satisfies JwtPayload);
    return { id: user.id, email, token };
  }

  function refreshCookie(res: request.Response): string {
    const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
    const cookie = raw?.find((c) => c.startsWith('refreshToken='));
    if (!cookie) throw new Error('No se recibió cookie de refresh');
    return cookie.split(';')[0];
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    sys = moduleFixture.get(SystemPrismaService);
    prisma = moduleFixture.get(PrismaService);
    jwt = moduleFixture.get(JwtService);

    tenantA = await sys.tenant.create({
      data: { name: `Reg A ${sfx}`, slug: `reg-a-${sfx}` },
    });
    tenantB = await sys.tenant.create({
      data: { name: `Reg B ${sfx}`, slug: `reg-b-${sfx}` },
    });
    ids.tenants.push(tenantA.id, tenantB.id);

    adminA = await createUser(tenantA.id, UserRole.admin, 'admin-a');
    agentA = await createUser(tenantA.id, UserRole.agent, 'agent-a');

    let systemTenant = await sys.tenant.findUnique({
      where: { slug: 'predia-saas' },
    });
    if (!systemTenant) {
      systemTenant = await sys.tenant.create({
        data: { name: 'Predia SaaS', slug: 'predia-saas' },
      });
      createdSystemTenant = true;
    }
    superAdmin = await createUser(
      systemTenant.id,
      UserRole.super_admin,
      'super',
    );

    category = await sys.category.create({
      data: {
        name: `Reg Cat ${sfx}`,
        slug: `reg-cat-${sfx}`,
        attribute_schema: {
          type: 'object',
          properties: { a: { type: 'number' } },
        },
      },
    });
    ids.categories.push(category.id);
  }, 30_000);

  afterAll(async () => {
    const tenantIds = ids.tenants;
    await sys.leadActivity.deleteMany({
      where: { tenant_id: { in: tenantIds } },
    });
    await sys.lead.deleteMany({ where: { tenant_id: { in: tenantIds } } });
    await sys.propertyImage.deleteMany({
      where: { tenant_id: { in: tenantIds } },
    });
    await sys.propertyAmenity.deleteMany({
      where: { tenant_id: { in: tenantIds } },
    });
    await sys.property.deleteMany({ where: { tenant_id: { in: tenantIds } } });
    await sys.user.deleteMany({ where: { id: { in: ids.users } } });
    await sys.tenantSite.deleteMany({
      where: { tenant_id: { in: tenantIds } },
    });
    await sys.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    if (createdSystemTenant) {
      await sys.tenant.deleteMany({ where: { slug: 'predia-saas' } });
    }
    await sys.categoryAmenity.deleteMany({
      where: { category_id: { in: ids.categories } },
    });
    await sys.category.deleteMany({ where: { id: { in: ids.categories } } });
    await sys.amenity.deleteMany({ where: { id: { in: ids.amenities } } });
    await sys.auditLog.deleteMany({
      where: {
        OR: [
          { tenant_id: { in: tenantIds } },
          { entity_id: { in: [...ids.amenities, ...ids.categories] } },
        ],
      },
    });
    await app.close();
  });

  describe('Transacciones con tenant en contexto', () => {
    it('$transaction([...]) es atómico: si una operación falla, se revierte todo', async () => {
      const lead = await sys.lead.create({
        data: { tenant_id: tenantA.id, name: 'atomic' },
      });

      await expect(
        tenantStore.run({ tenantId: tenantA.id }, () =>
          prisma.$transaction([
            prisma.lead.update({
              where: { id: lead.id },
              data: { name: 'cambiado' },
            }),
            prisma.leadActivity.create({
              data: {
                lead_id: lead.id,
                tenant_id: tenantA.id,
                type: 'note',
                description: 'x',
                created_by: randomUUID(), // FK inválida → falla
              },
            }),
          ]),
        ),
      ).rejects.toThrow();

      const after = await sys.lead.findUnique({ where: { id: lead.id } });
      expect(after?.name).toBe('atomic');
    });

    it('$transaction(async tx => ...) hace rollback si la función lanza', async () => {
      const lead = await sys.lead.create({
        data: { tenant_id: tenantA.id, name: 'itx' },
      });

      await expect(
        tenantStore.run({ tenantId: tenantA.id }, () =>
          prisma.$transaction(async (tx) => {
            await tx.lead.update({
              where: { id: lead.id },
              data: { name: 'cambiado' },
            });
            throw new Error('rollback');
          }),
        ),
      ).rejects.toThrow('rollback');

      const after = await sys.lead.findUnique({ where: { id: lead.id } });
      expect(after?.name).toBe('itx');
    });

    it('RLS sigue aplicando dentro de una transacción', async () => {
      const leadB = await sys.lead.create({
        data: { tenant_id: tenantB.id, name: 'de B' },
      });

      const [visible, inTx] = await tenantStore.run(
        { tenantId: tenantA.id },
        async () => {
          const batch = await prisma.$transaction([
            prisma.lead.findFirst({ where: { id: leadB.id } }),
          ]);
          const interactive = await prisma.$transaction((tx) =>
            tx.lead.findFirst({ where: { id: leadB.id } }),
          );
          return [batch[0], interactive];
        },
      );

      expect(visible).toBeNull();
      expect(inTx).toBeNull();
    });
  });

  describe('Leads', () => {
    it('un agente que crea un lead queda asignado y lo puede ver', async () => {
      const created = await request(server())
        .post('/api/v1/leads')
        .set(bearer(agentA.token))
        .send({ name: 'Lead del agente' })
        .expect(201);
      expect(created.body.assigned_to).toBe(agentA.id);

      const list = await request(server())
        .get('/api/v1/leads')
        .set(bearer(agentA.token))
        .expect(200);
      expect(list.body.data.map((l: { id: string }) => l.id)).toContain(
        created.body.id,
      );
    });

    it('PATCH con name: null responde 400 (antes 500)', async () => {
      const lead = await sys.lead.create({
        data: {
          tenant_id: tenantA.id,
          name: 'null test',
          assigned_to: agentA.id,
        },
      });
      await request(server())
        .patch(`/api/v1/leads/${lead.id}`)
        .set(bearer(agentA.token))
        .send({ name: null })
        .expect(400);
    });

    it('no se puede registrar a mano una actividad status_change (400)', async () => {
      const lead = await sys.lead.create({
        data: {
          tenant_id: tenantA.id,
          name: 'fake status',
          assigned_to: agentA.id,
        },
      });
      await request(server())
        .post(`/api/v1/leads/${lead.id}/activities`)
        .set(bearer(agentA.token))
        .send({
          type: 'status_change',
          description: 'Status changed from new to won',
        })
        .expect(400);
    });

    it('un agente no puede reasignar su lead (403)', async () => {
      const lead = await sys.lead.create({
        data: {
          tenant_id: tenantA.id,
          name: 'reasignar',
          assigned_to: agentA.id,
        },
      });
      await request(server())
        .patch(`/api/v1/leads/${lead.id}`)
        .set(bearer(agentA.token))
        .send({ assigned_to: adminA.id })
        .expect(403);
    });

    it('cambio de status crea la actividad en la misma transacción', async () => {
      const lead = await sys.lead.create({
        data: { tenant_id: tenantA.id, name: 'status', assigned_to: agentA.id },
      });
      await request(server())
        .patch(`/api/v1/leads/${lead.id}`)
        .set(bearer(agentA.token))
        .send({ status: LeadStatus.won })
        .expect(200);
      const activities = await sys.leadActivity.count({
        where: { lead_id: lead.id },
      });
      expect(activities).toBe(1);
    });
  });

  describe('DELETE con datos relacionados → 409 (antes 500)', () => {
    it('usuario con actividad en leads', async () => {
      const user = await createUser(
        tenantA.id,
        UserRole.agent,
        'with-activity',
      );
      const lead = await sys.lead.create({
        data: { tenant_id: tenantA.id, name: 'act' },
      });
      await sys.leadActivity.create({
        data: {
          lead_id: lead.id,
          tenant_id: tenantA.id,
          type: 'note',
          description: 'x',
          created_by: user.id,
        },
      });
      await request(server())
        .delete(`/api/v1/users/${user.id}`)
        .set(bearer(adminA.token))
        .expect(409);
    });

    it('tenant con usuarios', async () => {
      await request(server())
        .delete(`/api/v1/tenants/${tenantA.id}`)
        .set(bearer(superAdmin.token))
        .expect(409);
    });

    it('categoría con propiedades', async () => {
      await sys.property.create({
        data: {
          tenant_id: tenantA.id,
          title: 'usa categoria',
          slug: `usa-categoria-${sfx}`,
          price: 1,
          operation_type: OperationType.sale,
          category_id: category.id,
        },
      });
      await request(server())
        .delete(`/api/v1/categories/${category.id}`)
        .set(bearer(superAdmin.token))
        .expect(409);
    });
  });

  describe('Propiedades', () => {
    it('editar el attribute_schema invalida el validador cacheado', async () => {
      const cat = await sys.category.create({
        data: {
          name: `Schema ${sfx}`,
          slug: `schema-${sfx}`,
          attribute_schema: {
            type: 'object',
            properties: { a: { type: 'number' } },
          },
        },
      });
      ids.categories.push(cat.id);
      const body = {
        title: 'Casa',
        price: 100,
        operation_type: 'sale',
        category_id: cat.id,
        attributes: { a: 1 },
      };

      await request(server())
        .post('/api/v1/properties')
        .set(bearer(adminA.token))
        .send(body)
        .expect(201);
      await request(server())
        .patch(`/api/v1/categories/${cat.id}`)
        .set(bearer(superAdmin.token))
        .send({
          attribute_schema: {
            type: 'object',
            required: ['b'],
            properties: { a: { type: 'number' }, b: { type: 'string' } },
          },
        })
        .expect(200);
      await request(server())
        .post('/api/v1/properties')
        .set(bearer(adminA.token))
        .send(body)
        .expect(400);
    });

    it('PATCH con title: null responde 400 y una archivada no se puede editar', async () => {
      const created = await request(server())
        .post('/api/v1/properties')
        .set(bearer(adminA.token))
        .send({
          title: 'Para archivar',
          price: 100,
          operation_type: 'sale',
          category_id: category.id,
        })
        .expect(201);
      const id = created.body.id as string;

      await request(server())
        .patch(`/api/v1/properties/${id}`)
        .set(bearer(adminA.token))
        .send({ title: null })
        .expect(400);
      await request(server())
        .delete(`/api/v1/properties/${id}`)
        .set(bearer(adminA.token))
        .expect(204);
      await request(server())
        .patch(`/api/v1/properties/${id}`)
        .set(bearer(adminA.token))
        .send({ status: 'active' })
        .expect(404);
    });

    it('GET /properties/stats cuenta todas las propiedades del tenant', async () => {
      const res = await request(server())
        .get('/api/v1/properties/stats')
        .set(bearer(adminA.token))
        .expect(200);
      const real = await sys.property.count({
        where: { tenant_id: tenantA.id, status: { not: 'archived' } },
      });
      expect(res.body.total).toBe(real);
      expect(
        Object.values(res.body.by_status as Record<string, number>).reduce(
          (a, b) => a + b,
          0,
        ),
      ).toBe(real);
    });
  });

  describe('Varios', () => {
    it('PATCH tenant con advisor_email responde 400 (antes 500)', async () => {
      await request(server())
        .patch(`/api/v1/tenants/${tenantB.id}`)
        .set(bearer(superAdmin.token))
        .send({ advisor_email: 'x@y.com' })
        .expect(400);
    });

    it('crear una amenidad deja una sola fila de auditoría', async () => {
      const res = await request(server())
        .post('/api/v1/amenities')
        .set(bearer(superAdmin.token))
        .send({ name: `Amenidad ${sfx}` })
        .expect(201);
      ids.amenities.push(res.body.id as string);
      await new Promise((r) => setTimeout(r, 300)); // el log es fire-and-forget
      const rows = await sys.auditLog.count({
        where: { entity: 'amenity', entity_id: res.body.id as string },
      });
      expect(rows).toBe(1);
    });

    it('POST /email/test ya no es público', async () => {
      await request(server())
        .post('/email/test')
        .send({ to: 'x@example.com' })
        .expect(401);
      await request(server())
        .post('/email/test')
        .set(bearer(adminA.token))
        .send({ to: 'x@example.com' })
        .expect(403);
    });
  });

  describe('Auth', () => {
    it('forgot-password aplica el límite de 3 por 15 minutos', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 4; i++) {
        const res = await request(server())
          .post('/auth/forgot-password')
          .send({ email: `nadie-${sfx}@e2e.test` });
        statuses.push(res.status);
      }
      expect(statuses).toEqual([200, 200, 200, 429]);
    });

    it('validate-reset-token sin token responde 400 (antes 500)', async () => {
      await request(server()).get('/auth/validate-reset-token').expect(400);
    });

    it('lookup exige contraseña y no revela cuentas', async () => {
      await request(server())
        .post('/auth/lookup')
        .send({ email: adminA.email })
        .expect(400);

      const wrong = await request(server())
        .post('/auth/lookup')
        .send({ email: adminA.email, password: 'incorrecta' })
        .expect(200);
      expect(wrong.body).toEqual([]);

      const ok = await request(server())
        .post('/auth/lookup')
        .send({ email: adminA.email.toUpperCase(), password: PASSWORD })
        .expect(200);
      expect(ok.body).toEqual([{ id: tenantA.id, name: `Reg A ${sfx}` }]);
    });

    it('login no distingue mayúsculas en el email', async () => {
      await request(server())
        .post('/auth/login')
        .send({
          email: `  ${adminA.email.toUpperCase()} `,
          password: PASSWORD,
          tenantId: tenantA.id,
        })
        .expect(200);
    });

    it('un usuario deactivated no puede iniciar sesión', async () => {
      const user = await createUser(
        tenantA.id,
        UserRole.agent,
        'deactivated',
        UserStatus.deactivated,
      );
      await request(server())
        .post('/auth/login')
        .send({ email: user.email, password: PASSWORD, tenantId: tenantA.id })
        .expect(401);
    });

    it('logout revoca el refresh token', async () => {
      const login = await request(server())
        .post('/auth/login')
        .send({ email: agentA.email, password: PASSWORD, tenantId: tenantA.id })
        .expect(200);
      const cookie = refreshCookie(login);

      await request(server())
        .post('/auth/refresh')
        .set('Cookie', cookie)
        .expect(200);
      await request(server())
        .post('/auth/logout')
        .set('Cookie', cookie)
        .expect(204);
      await request(server())
        .post('/auth/refresh')
        .set('Cookie', cookie)
        .expect(401);
    });

    it('reset de contraseña cierra todas las sesiones', async () => {
      const user = await createUser(tenantA.id, UserRole.agent, 'reset');
      const login = await request(server())
        .post('/auth/login')
        .send({ email: user.email, password: PASSWORD, tenantId: tenantA.id })
        .expect(200);
      const cookie = refreshCookie(login);

      const plain = randomUUID();
      await sys.passwordResetToken.create({
        data: {
          user_id: user.id,
          token_hash: createHash('sha256').update(plain).digest('hex'),
          expires_at: new Date(Date.now() + 15 * 60_000),
        },
      });
      await request(server())
        .post('/auth/reset-password')
        .send({ token: plain, password: 'OtraClave123!' })
        .expect(200);

      await request(server())
        .post('/auth/refresh')
        .set('Cookie', cookie)
        .expect(401);
    });
  });
});
