import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SystemPrismaService } from '../src/prisma/system-prisma.service';
import {
  seedTenantIsolationFixture,
  teardownTenantIsolationFixture,
  TenantIsolationFixture,
} from './utils/tenant-isolation.fixture';

/**
 * Garantiza que un tenant nunca puede leer ni mutar datos de otro tenant,
 * ni por la capa de aplicación (controllers/services) ni por RLS directo.
 * Todo intento cross-tenant debe responder 404 — nunca 403 — para no
 * revelar la existencia del recurso a un tenant ajeno.
 */
describe('Tenant isolation (e2e)', () => {
  let app: INestApplication<App>;
  let systemPrisma: SystemPrismaService;
  let fixture: TenantIsolationFixture;
  let pool: Pool;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    systemPrisma = moduleFixture.get(SystemPrismaService);
    const jwt = moduleFixture.get(JwtService);
    fixture = await seedTenantIsolationFixture(systemPrisma, jwt);

    const config = moduleFixture.get(ConfigService);
    pool = new Pool({ connectionString: config.getOrThrow<string>('DATABASE_URL') });
  }, 30_000);

  afterAll(async () => {
    await pool.end();
    await teardownTenantIsolationFixture(systemPrisma, fixture);
    await app.close();
  });

  const server = () => app.getHttpServer();
  const asAgentA = () => `Bearer ${fixture.tenantA.agent.token}`;

  describe('Properties', () => {
    it('listing properties as agent A never includes tenant B properties', async () => {
      const res = await request(server())
        .get('/api/v1/properties')
        .set('Authorization', asAgentA())
        .expect(200);

      const body = res.body as { data: Array<{ id: string }> };
      const ids = body.data.map((p) => p.id);
      expect(ids).toContain(fixture.tenantA.property.id);
      expect(ids).not.toContain(fixture.tenantB.property.id);
    });

    it('agent A cannot fetch tenant B property by id (404)', () => {
      return request(server())
        .get(`/api/v1/properties/${fixture.tenantB.property.id}`)
        .set('Authorization', asAgentA())
        .expect(404);
    });

    it('agent A cannot fetch tenant B property by slug (404)', () => {
      return request(server())
        .get(`/api/v1/properties/slug/${fixture.tenantB.property.slug}`)
        .set('Authorization', asAgentA())
        .expect(404);
    });

    it('agent A cannot update tenant B property (404)', () => {
      return request(server())
        .patch(`/api/v1/properties/${fixture.tenantB.property.id}`)
        .set('Authorization', asAgentA())
        .send({ title: 'Hijacked title' })
        .expect(404);
    });

    it('agent A cannot delete tenant B property (404)', () => {
      return request(server())
        .delete(`/api/v1/properties/${fixture.tenantB.property.id}`)
        .set('Authorization', asAgentA())
        .expect(404);
    });
  });

  describe('Property images', () => {
    it('agent A cannot upload an image to a tenant B property (404)', () => {
      return request(server())
        .post(`/api/v1/properties/${fixture.tenantB.property.id}/images`)
        .set('Authorization', asAgentA())
        .attach('file', Buffer.from('fake-image-bytes'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(404);
    });

    it('agent A cannot delete an image of a tenant B property (404)', () => {
      return request(server())
        .delete(`/api/v1/properties/${fixture.tenantB.property.id}/images/${fixture.tenantB.image.id}`)
        .set('Authorization', asAgentA())
        .expect(404);
    });

    it('agent A cannot set the cover image of a tenant B property (404)', () => {
      return request(server())
        .patch(
          `/api/v1/properties/${fixture.tenantB.property.id}/images/${fixture.tenantB.image.id}/cover`,
        )
        .set('Authorization', asAgentA())
        .expect(404);
    });

    it('agent A cannot reorder images of a tenant B property (404)', () => {
      return request(server())
        .patch(`/api/v1/properties/${fixture.tenantB.property.id}/images/reorder`)
        .set('Authorization', asAgentA())
        .send({ items: [{ id: fixture.tenantB.image.id, position: 0 }] })
        .expect(404);
    });
  });

  describe('Property amenities', () => {
    it('agent A cannot list amenities of a tenant B property (404)', () => {
      return request(server())
        .get(`/api/v1/properties/${fixture.tenantB.property.id}/amenities`)
        .set('Authorization', asAgentA())
        .expect(404);
    });

    it('agent A cannot associate amenities to a tenant B property (404)', () => {
      return request(server())
        .post(`/api/v1/properties/${fixture.tenantB.property.id}/amenities`)
        .set('Authorization', asAgentA())
        .send({ amenity_ids: [fixture.amenity.id] })
        .expect(404);
    });

    it('agent A cannot remove amenities from a tenant B property (404)', () => {
      return request(server())
        .delete(`/api/v1/properties/${fixture.tenantB.property.id}/amenities`)
        .set('Authorization', asAgentA())
        .send({ amenity_ids: [fixture.amenity.id] })
        .expect(404);
    });
  });

  describe('Row Level Security (direct DB query, bypassing the application layer)', () => {
    it('blocks a cross-tenant SELECT even with a raw query', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT set_config($1, $2, true)', [
          'app.current_tenant_id',
          fixture.tenantA.tenant.id,
        ]);
        const result = await client.query('SELECT id FROM properties WHERE id = $1', [
          fixture.tenantB.property.id,
        ]);
        expect(result.rows).toHaveLength(0);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    });

    it('allows a same-tenant SELECT (sanity check — RLS is not blocking everything)', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT set_config($1, $2, true)', [
          'app.current_tenant_id',
          fixture.tenantA.tenant.id,
        ]);
        const result = await client.query('SELECT id FROM properties WHERE id = $1', [
          fixture.tenantA.property.id,
        ]);
        expect(result.rows).toHaveLength(1);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    });
  });
});
