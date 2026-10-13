import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import {
  LocationType,
  OperationType,
  PropertyStatus,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/app-setup';
import { JwtPayload } from '../src/modules/auth/interfaces/jwt-payload.interface';
import { SystemPrismaService } from '../src/prisma/system-prisma.service';

const ORIGIN_A = 'https://www.agencia-a.test';
const ORIGIN_B = 'https://www.agencia-b.test';
const ORIGIN_PORTAL = 'https://portal.predia.test';

/**
 * API pública (Fase 5) contra la app real, con la misma configuración HTTP que
 * main.ts (configureApp): CORS, cabeceras y validación.
 * Cubre OWASP API Top 10 2023: API1 (BOLA/aislamiento), API2 (auth de keys),
 * API3 (exposición de datos), API4 (paginación/rate limit), API5 (scopes),
 * API6 (flujo de leads), API8 (CORS/cabeceras).
 */
describe('Public API (e2e)', () => {
  let app: NestExpressApplication;
  let sys: SystemPrismaService;
  let jwt: JwtService;
  const sfx = randomUUID().slice(0, 8);

  const ids = {
    tenants: [] as string[],
    users: [] as string[],
    locations: [] as string[],
  };
  let createdSystemTenant = false;
  let systemTenantId: string;

  let tenantA: { id: string; slug: string };
  let tenantB: { id: string; slug: string };
  let tenantC: { id: string; slug: string };
  let adminA: string;
  let adminB: string;
  let adminC: string;
  let agentAId: string;
  let agentA: string;
  let superAdmin: string;
  let categorySlug: string;
  let province: { id: string };

  const keys = {} as Record<
    'pkA' | 'skA' | 'pkB' | 'skC' | 'skPortal' | 'pkPortal' | 'rateLimit',
    { id: string; plaintext: string }
  >;

  const slugs = {
    a1: `casa-publicada-a-${sfx}`,
    a2: `borrador-a-${sfx}`,
    a3: `vendida-a-${sfx}`,
    b1: `casa-publicada-b-${sfx}`,
    c1: `casa-vencida-c-${sfx}`,
  };

  const server = () => app.getHttpServer();
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

  async function makeTenant(label: string, status: SubscriptionStatus) {
    const t = await sys.tenant.create({
      data: {
        name: `Agencia ${label} ${sfx}`,
        slug: `agencia-${label}-${sfx}`,
        subscription_status: status,
      },
    });
    ids.tenants.push(t.id);
    return { id: t.id, slug: t.slug };
  }

  async function makeUser(tenantId: string, role: UserRole, label: string) {
    const u = await sys.user.create({
      data: {
        tenant_id: tenantId,
        email: `${label}-${sfx}@e2e.test`,
        password_hash: 'unused',
        role,
        first_name: label,
        last_name: 'E2E',
      },
    });
    ids.users.push(u.id);
    return {
      id: u.id,
      token: jwt.sign({ sub: u.id, tenantId, role } satisfies JwtPayload),
    };
  }

  async function createKey(token: string, body: object) {
    const res = await request(server())
      .post('/api/v1/api-keys')
      .set(bearer(token))
      .send(body);
    expect(res.status).toBe(201);
    return {
      id: res.body.id as string,
      plaintext: res.body.plaintext_key as string,
    };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    sys = moduleFixture.get(SystemPrismaService);
    jwt = moduleFixture.get(JwtService);

    tenantA = await makeTenant('a', SubscriptionStatus.active);
    tenantB = await makeTenant('b', SubscriptionStatus.trial);
    tenantC = await makeTenant('c', SubscriptionStatus.past_due);

    adminA = (await makeUser(tenantA.id, UserRole.admin, 'admin-a')).token;
    adminB = (await makeUser(tenantB.id, UserRole.admin, 'admin-b')).token;
    adminC = (await makeUser(tenantC.id, UserRole.admin, 'admin-c')).token;
    const agent = await makeUser(tenantA.id, UserRole.agent, 'agent-a');
    agentAId = agent.id;
    agentA = agent.token;
    const agentB = await makeUser(tenantB.id, UserRole.agent, 'agent-b');

    let systemTenant = await sys.tenant.findUnique({
      where: { slug: 'predia-saas' },
    });
    if (!systemTenant) {
      systemTenant = await sys.tenant.create({
        data: { name: 'Predia SaaS', slug: 'predia-saas' },
      });
      createdSystemTenant = true;
    }
    systemTenantId = systemTenant.id;
    superAdmin = (
      await makeUser(systemTenant.id, UserRole.super_admin, 'super')
    ).token;

    const category = await sys.category.create({
      data: {
        name: `Cat ${sfx}`,
        slug: `cat-${sfx}`,
        attribute_schema: {
          type: 'object',
          properties: {
            habitaciones: { type: 'integer', title: 'Habitaciones' },
          },
        },
      },
    });
    categorySlug = category.slug;

    const code = String(Math.floor(Math.random() * 1e9));
    province = await sys.location.create({
      data: {
        name: `Prov ${sfx}`,
        code: `p${code}`,
        type: LocationType.province,
      },
    });
    const canton = await sys.location.create({
      data: {
        name: `Cantón ${sfx}`,
        code: `c${code}`,
        type: LocationType.canton,
        parent_id: province.id,
      },
    });
    const district = await sys.location.create({
      data: {
        name: `Distrito ${sfx}`,
        code: `d${code}`,
        type: LocationType.district,
        parent_id: canton.id,
      },
    });
    ids.locations.push(district.id, canton.id, province.id);

    const base = {
      price: 150000,
      operation_type: OperationType.sale,
      category_id: category.id,
      attributes: { habitaciones: 3 },
    };
    await sys.property.createMany({
      data: [
        {
          ...base,
          tenant_id: tenantA.id,
          title: 'Casa A',
          slug: slugs.a1,
          is_published: true,
          status: PropertyStatus.active,
          agent_id: agentAId,
          location_id: district.id,
          lat: 9.928123,
          lng: -84.090765,
        },
        {
          ...base,
          tenant_id: tenantA.id,
          title: 'Borrador A',
          slug: slugs.a2,
          is_published: false,
          status: PropertyStatus.draft,
        },
        {
          ...base,
          tenant_id: tenantA.id,
          title: 'Vendida A',
          slug: slugs.a3,
          is_published: true,
          status: PropertyStatus.sold,
        },
        {
          ...base,
          tenant_id: tenantB.id,
          title: 'Casa B',
          slug: slugs.b1,
          is_published: true,
          status: PropertyStatus.active,
          agent_id: agentB.id,
        },
        {
          ...base,
          tenant_id: tenantC.id,
          title: 'Casa C',
          slug: slugs.c1,
          is_published: true,
          status: PropertyStatus.active,
        },
      ],
    });

    keys.pkA = await createKey(adminA, {
      name: 'Web A',
      type: 'publishable',
      allowed_origins: [ORIGIN_A],
    });
    keys.skA = await createKey(adminA, { name: 'Servidor A', type: 'secret' });
    keys.pkB = await createKey(adminB, {
      name: 'Web B',
      type: 'publishable',
      allowed_origins: [ORIGIN_B],
    });
    keys.skC = await createKey(adminC, { name: 'Servidor C', type: 'secret' });
    keys.rateLimit = await createKey(adminA, {
      name: 'Rate limit',
      type: 'secret',
    });
    keys.skPortal = await createKey(superAdmin, {
      name: 'Portal build',
      type: 'secret',
    });
    keys.pkPortal = await createKey(superAdmin, {
      name: 'Portal web',
      type: 'publishable',
      allowed_origins: [ORIGIN_PORTAL],
    });
  }, 60_000);

  afterAll(async () => {
    const tenantIds = [...ids.tenants, systemTenantId];
    await sys.lead.deleteMany({
      where: {
        tenant_id: { in: tenantIds },
        email: { endsWith: `-${sfx}@lead.test` },
      },
    });
    await sys.lead.deleteMany({ where: { tenant_id: { in: ids.tenants } } });
    await sys.apiKey.deleteMany({
      where: {
        tenant_id: { in: tenantIds },
        name: {
          in: [
            'Web A',
            'Servidor A',
            'Web B',
            'Servidor C',
            'Rate limit',
            'Portal build',
            'Portal web',
          ],
        },
      },
    });
    await sys.property.deleteMany({
      where: { tenant_id: { in: ids.tenants } },
    });
    await sys.user.deleteMany({ where: { id: { in: ids.users } } });
    await sys.tenant.deleteMany({ where: { id: { in: ids.tenants } } });
    if (createdSystemTenant)
      await sys.tenant.delete({ where: { id: systemTenantId } });
    await sys.location.deleteMany({ where: { id: { in: ids.locations } } });
    await sys.category.deleteMany({ where: { slug: categorySlug } });
    await sys.auditLog.deleteMany({
      where: {
        tenant_id: { in: tenantIds },
        entity: { in: ['api_key', 'lead'] },
        created_at: { gte: new Date(Date.now() - 10 * 60_000) },
      },
    });
    await app.close();
  });

  const get = (path: string, key: string, origin?: string) => {
    const r = request(server()).get(path).set('X-API-Key', key);
    return origin ? r.set('Origin', origin) : r;
  };

  describe('Gestión de keys (CRM)', () => {
    it('la key en texto plano solo aparece al crearla; el listado no la expone', async () => {
      const list = await request(server())
        .get('/api/v1/api-keys')
        .set(bearer(adminA))
        .expect(200);
      const serialized = JSON.stringify(list.body);
      expect(serialized).not.toContain(keys.pkA.plaintext);
      expect(serialized).not.toContain('key_hash');
      expect(list.body[0].key_prefix).toMatch(/^(pk|sk)_test_/);
    });

    it('el audit log de la creación no guarda la key', async () => {
      const row = await sys.auditLog.findFirst({
        where: { entity: 'api_key', entity_id: keys.pkA.id },
      });
      expect(row).not.toBeNull();
      expect(JSON.stringify(row?.payload)).not.toContain(keys.pkA.plaintext);
    });

    it.each([
      [{ name: 'x', type: 'publishable' }, 'publishable sin orígenes'],
      [
        {
          name: 'xx',
          type: 'publishable',
          allowed_origins: ['http://evil.test'],
        },
        'http fuera de localhost',
      ],
      [
        {
          name: 'xx',
          type: 'publishable',
          allowed_origins: ['https://*.a.test'],
        },
        'comodín',
      ],
      [
        {
          name: 'xx',
          type: 'publishable',
          allowed_origins: ['https://a.test/ruta'],
        },
        'con ruta',
      ],
      [
        { name: 'xx', type: 'secret', allowed_origins: [ORIGIN_A] },
        'secret con orígenes',
      ],
    ])('rechaza %j (%s)', async (...[body]: [object, string]) => {
      await request(server())
        .post('/api/v1/api-keys')
        .set(bearer(adminA))
        .send(body)
        .expect(400);
    });

    it('un agente no gestiona keys y otro tenant no revoca las ajenas', async () => {
      await request(server())
        .get('/api/v1/api-keys')
        .set(bearer(agentA))
        .expect(403);
      await request(server())
        .delete(`/api/v1/api-keys/${keys.pkA.id}`)
        .set(bearer(adminB))
        .expect(404);
    });

    it('las keys del super_admin son de scope portal', async () => {
      const list = await request(server())
        .get('/api/v1/api-keys')
        .set(bearer(superAdmin))
        .expect(200);
      const portal = (list.body as { id: string; scope: string }[]).find(
        (k) => k.id === keys.skPortal.id,
      );
      expect(portal?.scope).toBe('portal');
    });
  });

  describe('Autenticación con API key (API2)', () => {
    it('sin key → 401; key mal formada → 401; key en la URL → 400', async () => {
      await request(server()).get('/public/v1/properties').expect(401);
      await get('/public/v1/properties', 'sk_test_noexiste').expect(401);
      await request(server())
        .get(`/public/v1/properties?api_key=${keys.skA.plaintext}`)
        .expect(400);
    });

    it('publishable: exige un Origin permitido', async () => {
      await get('/public/v1/properties', keys.pkA.plaintext).expect(403);
      await get(
        '/public/v1/properties',
        keys.pkA.plaintext,
        'https://evil.test',
      ).expect(403);
      await get('/public/v1/properties', keys.pkA.plaintext, ORIGIN_B).expect(
        403,
      );
      await get('/public/v1/properties', keys.pkA.plaintext, ORIGIN_A).expect(
        200,
      );
    });

    it('secret: se rechaza si llega desde un navegador (con Origin)', async () => {
      await get('/public/v1/properties', keys.skA.plaintext, ORIGIN_A).expect(
        403,
      );
      await get('/public/v1/properties', keys.skA.plaintext).expect(200);
    });

    it('sin suscripción vigente → 403', async () => {
      await get('/public/v1/properties', keys.skC.plaintext).expect(403);
    });

    it('una key revocada deja de funcionar al instante', async () => {
      const tmp = await createKey(adminA, { name: 'Temporal', type: 'secret' });
      await get('/public/v1/properties', tmp.plaintext).expect(200);
      await request(server())
        .delete(`/api/v1/api-keys/${tmp.id}`)
        .set(bearer(adminA))
        .expect(200);
      await get('/public/v1/properties', tmp.plaintext).expect(401);
      await sys.apiKey.delete({ where: { id: tmp.id } });
    });

    it('una key vencida no autentica', async () => {
      const tmp = await createKey(adminA, { name: 'Vencida', type: 'secret' });
      await sys.apiKey.update({
        where: { id: tmp.id },
        data: { expires_at: new Date(Date.now() - 1000) },
      });
      await get('/public/v1/properties', tmp.plaintext).expect(401);
      await sys.apiKey.delete({ where: { id: tmp.id } });
    });
  });

  describe('Datos y aislamiento (API1 / API3 / API4 / API5)', () => {
    it('key de tenant: solo propiedades publicadas y activas de su inmobiliaria', async () => {
      const res = await get('/public/v1/properties', keys.skA.plaintext).expect(
        200,
      );
      const found = (res.body.data as { slug: string }[]).map((p) => p.slug);
      expect(found).toContain(slugs.a1);
      expect(found).not.toContain(slugs.a2); // borrador
      expect(found).not.toContain(slugs.a3); // vendida
      expect(found).not.toContain(slugs.b1); // otra inmobiliaria
    });

    it('no expone campos internos', async () => {
      const list = await get(
        '/public/v1/properties',
        keys.skA.plaintext,
      ).expect(200);
      const detail = await get(
        `/public/v1/properties/${slugs.a1}`,
        keys.skA.plaintext,
      ).expect(200);
      for (const body of [list.body.data[0], detail.body]) {
        for (const field of [
          'tenant_id',
          'agent_id',
          'is_published',
          'status',
          'location_id',
          'category_id',
        ]) {
          expect(body).not.toHaveProperty(field);
        }
      }
      expect(JSON.stringify(detail.body)).not.toContain('@e2e.test'); // email del agente
      expect(detail.body.agent).toEqual({
        first_name: 'agent-a',
        last_name: 'E2E',
      });
      expect(detail.body.coordinates).toEqual({ lat: 9.928, lng: -84.091 });
    });

    it('detalle de otra inmobiliaria → 404', async () => {
      await get(`/public/v1/properties/${slugs.b1}`, keys.skA.plaintext).expect(
        404,
      );
    });

    it('key de portal: cruza inmobiliarias pero solo con suscripción vigente', async () => {
      const res = await get(
        `/public/v1/properties?category=${categorySlug}&limit=50`,
        keys.skPortal.plaintext,
      ).expect(200);
      const found = (res.body.data as { slug: string }[]).map((p) => p.slug);
      expect(found).toEqual(expect.arrayContaining([slugs.a1, slugs.b1]));
      expect(found).not.toContain(slugs.c1); // past_due
      expect(found).not.toContain(slugs.a2);
    });

    it('detalle con key de portal exige ?tenant', async () => {
      await get(
        `/public/v1/properties/${slugs.b1}`,
        keys.skPortal.plaintext,
      ).expect(400);
      await get(
        `/public/v1/properties/${slugs.b1}?tenant=${tenantB.slug}`,
        keys.skPortal.plaintext,
      ).expect(200);
      await get(
        `/public/v1/properties/${slugs.b1}?tenant=${tenantA.slug}`,
        keys.skPortal.plaintext,
      ).expect(404);
    });

    it('filtra por provincia incluyendo cantones y distritos', async () => {
      const res = await get(
        `/public/v1/properties?location_id=${province.id}`,
        keys.skA.plaintext,
      ).expect(200);
      expect((res.body.data as { slug: string }[]).map((p) => p.slug)).toEqual([
        slugs.a1,
      ]);
      expect(res.body.data[0].location.parents).toEqual([
        `Cantón ${sfx}`,
        `Prov ${sfx}`,
      ]);
    });

    it('paginación con tope: limit > 50 → 400', async () => {
      await get('/public/v1/properties?limit=500', keys.skA.plaintext).expect(
        400,
      );
    });

    it('catálogos: el árbol de ubicaciones no expone campos internos', async () => {
      const res = await get('/public/v1/locations', keys.skA.plaintext).expect(
        200,
      );
      type Node = { children: Node[] } & Record<string, unknown>;
      const walk = (nodes: Node[]): Node[] =>
        nodes.flatMap((n) => [n, ...walk(n.children)]);
      const all = walk(res.body as Node[]);
      expect(all.length).toBeGreaterThan(0);
      for (const node of all) {
        expect(Object.keys(node).sort()).toEqual([
          'children',
          'id',
          'name',
          'type',
        ]);
      }
    });

    it('/site es solo para keys de tenant', async () => {
      const res = await get('/public/v1/site', keys.skA.plaintext).expect(200);
      expect(res.body.slug).toBe(tenantA.slug);
      await get('/public/v1/site', keys.skPortal.plaintext).expect(403);
    });
  });

  describe('Captura de leads (API6)', () => {
    const lead = (extra: object = {}) => ({
      name: 'Visitante Web',
      email: `visitante-${sfx}@lead.test`,
      message: 'Quiero agendar una visita',
      consent: true,
      ...extra,
    });

    it('desde la web de la inmobiliaria: crea el lead asignado al agente de la propiedad', async () => {
      await request(server())
        .post('/public/v1/leads')
        .set('X-API-Key', keys.pkA.plaintext)
        .set('Origin', ORIGIN_A)
        .send(lead({ property_slug: slugs.a1 }))
        .expect(202);
      const created = await sys.lead.findFirst({
        where: { tenant_id: tenantA.id, email: `visitante-${sfx}@lead.test` },
      });
      expect(created).toMatchObject({
        source: 'web',
        status: 'new',
        assigned_to: agentAId,
      });
    });

    it('honeypot: responde igual pero no guarda nada', async () => {
      await request(server())
        .post('/public/v1/leads')
        .set('X-API-Key', keys.skA.plaintext)
        .send(
          lead({ email: `bot-${sfx}@lead.test`, website: 'http://spam.test' }),
        )
        .expect(202);
      expect(
        await sys.lead.count({ where: { email: `bot-${sfx}@lead.test` } }),
      ).toBe(0);
    });

    it('valida consentimiento, contacto y propiedad', async () => {
      const post = (body: object) =>
        request(server())
          .post('/public/v1/leads')
          .set('X-API-Key', keys.skA.plaintext)
          .send(body);
      await post(lead({ consent: false })).expect(400);
      await post({ name: 'Sin contacto', consent: true }).expect(400);
      await post(lead({ property_slug: slugs.b1 })).expect(404); // de otra inmobiliaria
      await post(lead({ tenant_slug: tenantB.slug })).expect(400); // tenant_slug solo en portal
    });

    it('desde el portal: va a la inmobiliaria de la propiedad, o a Predia si es contacto general', async () => {
      await request(server())
        .post('/public/v1/leads')
        .set('X-API-Key', keys.pkPortal.plaintext)
        .set('Origin', ORIGIN_PORTAL)
        .send(
          lead({
            email: `portal-b-${sfx}@lead.test`,
            property_slug: slugs.b1,
            tenant_slug: tenantB.slug,
          }),
        )
        .expect(202);
      expect(
        await sys.lead.count({
          where: { tenant_id: tenantB.id, email: `portal-b-${sfx}@lead.test` },
        }),
      ).toBe(1);

      await request(server())
        .post('/public/v1/leads')
        .set('X-API-Key', keys.pkPortal.plaintext)
        .set('Origin', ORIGIN_PORTAL)
        .send(lead({ email: `general-${sfx}@lead.test` }))
        .expect(202);
      expect(
        await sys.lead.count({
          where: {
            tenant_id: systemTenantId,
            email: `general-${sfx}@lead.test`,
          },
        }),
      ).toBe(1);
    });

    it('rate limit: el 6.º envío en 10 minutos (misma key e IP) → 429', async () => {
      const statuses: number[] = [];
      let last: request.Response | undefined;
      for (let i = 0; i < 6; i++) {
        last = await request(server())
          .post('/public/v1/leads')
          .set('X-API-Key', keys.rateLimit.plaintext)
          .send(lead({ email: `rate-${i}-${sfx}@lead.test` }));
        statuses.push(last.status);
      }
      expect(statuses).toEqual([202, 202, 202, 202, 202, 429]);
      // El formulario lo lee para decir cuándo reintentar.
      expect(Number(last?.headers['retry-after-public'])).toBeGreaterThan(0);
    });
  });

  describe('CORS y cabeceras (API8)', () => {
    it('preflight de /public: permite orígenes registrados y nada más', async () => {
      const ok = await request(server())
        .options('/public/v1/properties')
        .set('Origin', ORIGIN_A)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'x-api-key');
      expect(ok.headers['access-control-allow-origin']).toBe(ORIGIN_A);
      expect(ok.headers['access-control-allow-credentials']).toBeUndefined();

      const evil = await request(server())
        .options('/public/v1/properties')
        .set('Origin', 'https://evil.test')
        .set('Access-Control-Request-Method', 'GET');
      expect(evil.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('el navegador puede leer Retry-After-public (expose-headers)', async () => {
      const res = await get(
        '/public/v1/properties',
        keys.pkA.plaintext,
        ORIGIN_A,
      ).expect(200);
      expect(res.headers['access-control-allow-origin']).toBe(ORIGIN_A);
      expect(res.headers['access-control-expose-headers']).toMatch(
        /Retry-After-public/,
      );
    });

    it('un origen de key pública no gana acceso CORS al CRM', async () => {
      const res = await request(server())
        .options('/api/v1/properties')
        .set('Origin', ORIGIN_A)
        .set('Access-Control-Request-Method', 'GET');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('cabeceras de seguridad y sin X-Powered-By', async () => {
      const res = await get('/public/v1/properties', keys.skA.plaintext).expect(
        200,
      );
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['vary']).toMatch(/X-API-Key/i);
    });
  });
});
