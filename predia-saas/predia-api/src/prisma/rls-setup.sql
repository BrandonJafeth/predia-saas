-- Run ONCE in psql as superuser before deploying to production.
-- Sets up the two app roles with least-privilege permissions.
--
-- Usage:
--   psql -U postgres -d predia -f src/prisma/rls-setup.sql
--
-- Then update .env:
--   DATABASE_URL     → credentials for predia_app
--   SYSTEM_DATABASE_URL → credentials for predia_system

-- ─── predia_app ───────────────────────────────────────────────────────────────
-- Used by PrismaService (tenant DB). NOBYPASSRLS enforces RLS tenant isolation.

CREATE ROLE predia_app LOGIN PASSWORD 'change-me-app' NOBYPASSRLS;

GRANT SELECT, INSERT, UPDATE, DELETE ON "Tenant", "User" TO predia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_app;

-- ─── predia_system ────────────────────────────────────────────────────────────
-- Used by SystemPrismaService. BYPASSRLS needed to read users across all tenants.
-- Write access is intentionally limited: only INSERT on "User" (createSuperAdmin).

CREATE ROLE predia_system LOGIN PASSWORD 'change-me-system' BYPASSRLS;

GRANT SELECT ON "Tenant", "User" TO predia_system;
GRANT INSERT ON "User" TO predia_system;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_system;
