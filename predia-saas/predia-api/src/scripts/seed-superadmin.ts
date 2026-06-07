import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const SYSTEM_TENANT_SLUG = 'predia-saas';
const SYSTEM_TENANT_NAME = 'Predia SaaS';

async function main() {
  const email = process.env.SUPERADMIN_EMAIL ?? process.argv[2];
  const password = process.env.SUPERADMIN_PASSWORD ?? process.argv[3];

  if (!email || !password) {
    console.error(
      'Usage: pnpm run seed:superadmin <email> <password>\n' +
      'Or set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD env vars.\n' +
      'No defaults provided for security reasons.',
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    let tenant = await prisma.tenant.findUnique({
      where: { slug: SYSTEM_TENANT_SLUG },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: SYSTEM_TENANT_NAME, slug: SYSTEM_TENANT_SLUG },
      });
      console.log(`Created system tenant (id: ${tenant.id})`);
    } else {
      console.log(`System tenant already exists (id: ${tenant.id})`);
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenant.id}, true)`;

      const existing = await tx.user.findFirst({
        where: { email, tenant_id: tenant.id },
      });

      if (existing) return null;

      return tx.user.create({
        data: {
          email,
          password_hash,
          role: UserRole.super_admin,
          first_name: process.env.SUPERADMIN_FIRST_NAME ?? process.argv[4] ?? 'Predia',
          last_name: process.env.SUPERADMIN_LAST_NAME ?? process.argv[5] ?? 'Admin',
          tenant_id: tenant.id,
        },
        select: { id: true, email: true, role: true },
      });
    });

    if (!result) {
      console.log(`Superadmin '${email}' already exists. Nothing to do.`);
      return;
    }

    console.log(`Superadmin created: ${result.email} (id: ${result.id})`);
    console.log(`Login with tenantSlug: '${SYSTEM_TENANT_SLUG}'`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
