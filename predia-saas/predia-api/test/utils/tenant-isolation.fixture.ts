import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { OperationType, UserRole } from '@prisma/client';
import { SystemPrismaService } from '../../src/prisma/system-prisma.service';
import { JwtPayload } from '../../src/modules/auth/interfaces/jwt-payload.interface';

export interface SeededTenant {
  tenant: { id: string; slug: string };
  admin: { id: string; token: string };
  agent: { id: string; token: string };
  property: { id: string; slug: string };
  image: { id: string };
}

export interface TenantIsolationFixture {
  category: { id: string };
  amenity: { id: string };
  tenantA: SeededTenant;
  tenantB: SeededTenant;
}

/**
 * Crea dos tenants aislados (A y B), cada uno con admin + agente, una
 * property, una imagen y una amenidad asociada. No comparte datos con el
 * seed de dev — todo el catálogo global (category, amenity) se crea con
 * slugs únicos por corrida y se borra en teardownTenantIsolationFixture.
 * Usa SystemPrismaService (BYPASSRLS) para poder insertar filas de ambos
 * tenants sin que RLS bloquee el setup.
 */
export async function seedTenantIsolationFixture(
  systemPrisma: SystemPrismaService,
  jwt: JwtService,
): Promise<TenantIsolationFixture> {
  const suffix = randomUUID().slice(0, 8);

  const category = await systemPrisma.category.create({
    data: {
      name: `E2E Isolation Category ${suffix}`,
      slug: `e2e-isolation-category-${suffix}`,
      attribute_schema: { type: 'object', properties: {}, required: [] },
    },
  });

  const amenity = await systemPrisma.amenity.create({
    data: {
      name: `E2E Isolation Amenity ${suffix}`,
      slug: `e2e-isolation-amenity-${suffix}`,
    },
  });

  const tenantA = await buildTenant(systemPrisma, jwt, 'a', suffix, category.id, amenity.id);
  const tenantB = await buildTenant(systemPrisma, jwt, 'b', suffix, category.id, amenity.id);

  return { category: { id: category.id }, amenity: { id: amenity.id }, tenantA, tenantB };
}

export async function teardownTenantIsolationFixture(
  systemPrisma: SystemPrismaService,
  fixture: TenantIsolationFixture,
): Promise<void> {
  const tenantIds = [fixture.tenantA.tenant.id, fixture.tenantB.tenant.id];

  await systemPrisma.propertyAmenity.deleteMany({ where: { tenant_id: { in: tenantIds } } });
  await systemPrisma.propertyImage.deleteMany({ where: { tenant_id: { in: tenantIds } } });
  await systemPrisma.property.deleteMany({ where: { tenant_id: { in: tenantIds } } });
  await systemPrisma.user.deleteMany({ where: { tenant_id: { in: tenantIds } } });
  await systemPrisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await systemPrisma.categoryAmenity.deleteMany({ where: { category_id: fixture.category.id } });
  await systemPrisma.category.delete({ where: { id: fixture.category.id } });
  await systemPrisma.amenity.delete({ where: { id: fixture.amenity.id } });
}

async function buildTenant(
  systemPrisma: SystemPrismaService,
  jwt: JwtService,
  label: 'a' | 'b',
  suffix: string,
  categoryId: string,
  amenityId: string,
): Promise<SeededTenant> {
  const tenant = await systemPrisma.tenant.create({
    data: {
      name: `E2E Tenant ${label.toUpperCase()} ${suffix}`,
      slug: `e2e-tenant-${label}-${suffix}`,
    },
  });

  const admin = await systemPrisma.user.create({
    data: {
      tenant_id: tenant.id,
      email: `admin-${label}-${suffix}@e2e.test`,
      password_hash: 'unused-in-e2e',
      role: UserRole.admin,
      first_name: 'Admin',
      last_name: label.toUpperCase(),
    },
  });

  const agent = await systemPrisma.user.create({
    data: {
      tenant_id: tenant.id,
      email: `agent-${label}-${suffix}@e2e.test`,
      password_hash: 'unused-in-e2e',
      role: UserRole.agent,
      first_name: 'Agent',
      last_name: label.toUpperCase(),
    },
  });

  const property = await systemPrisma.property.create({
    data: {
      tenant_id: tenant.id,
      title: `Property ${label.toUpperCase()} ${suffix}`,
      slug: `property-${label}-${suffix}`,
      price: 100000,
      operation_type: OperationType.sale,
      category_id: categoryId,
      agent_id: agent.id,
      attributes: {},
    },
  });

  const image = await systemPrisma.propertyImage.create({
    data: {
      property_id: property.id,
      tenant_id: tenant.id,
      url: `https://example.test/e2e/${suffix}-${label}.jpg`,
      public_id: `e2e/${suffix}/${label}`,
      position: 0,
      is_cover: true,
    },
  });

  await systemPrisma.propertyAmenity.create({
    data: { property_id: property.id, amenity_id: amenityId, tenant_id: tenant.id },
  });

  const adminToken = jwt.sign(
    { sub: admin.id, tenantId: tenant.id, role: admin.role } satisfies JwtPayload,
  );
  const agentToken = jwt.sign(
    { sub: agent.id, tenantId: tenant.id, role: agent.role } satisfies JwtPayload,
  );

  return {
    tenant: { id: tenant.id, slug: tenant.slug },
    admin: { id: admin.id, token: adminToken },
    agent: { id: agent.id, token: agentToken },
    property: { id: property.id, slug: property.slug },
    image: { id: image.id },
  };
}
