-- Run ONCE in psql as superuser before deploying to production.
-- Sets up the two app roles with least-privilege permissions.
--
-- Usage:
--   psql -U postgres -d predia -f src/prisma/rls-setup.sql
--
-- Then update .env:
--   DATABASE_URL          → credentials for predia_app
--   SYSTEM_DATABASE_URL   → credentials for predia_system

-- ─── predia_app ───────────────────────────────────────────────────────────────
-- Used by PrismaService (tenant DB). NOBYPASSRLS enforces RLS tenant isolation.

CREATE ROLE predia_app LOGIN PASSWORD 'change-me-app' NOBYPASSRLS;

GRANT CONNECT ON DATABASE predia TO predia_app;
GRANT USAGE ON SCHEMA public TO predia_app;

-- Tablas existentes al momento de correr este script
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_app;

-- Tablas futuras (creadas por Prisma Migrate)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO predia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO predia_app;

-- ─── predia_system ────────────────────────────────────────────────────────────
-- Used by SystemPrismaService. BYPASSRLS needed to read all tenants.
-- Write access intentionally limited.

CREATE ROLE predia_system LOGIN PASSWORD 'change-me-system' BYPASSRLS;

GRANT CONNECT ON DATABASE predia TO predia_system;
GRANT USAGE ON SCHEMA public TO predia_system;

-- Tablas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_system;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_system;

-- Tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO predia_system;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO predia_system;

-- ─── audit_log — append-only + tenant isolation ──────────────────────────────
-- Correr esto DESPUÉS de crear la tabla audit_log con Prisma Migrate.

-- Append-only: predia_app no puede modificar ni borrar registros de auditoría.
REVOKE UPDATE, DELETE ON audit_log FROM predia_app;

-- Row-level security: predia_app solo ve registros de su propio tenant.
-- predia_system (BYPASSRLS) siempre ve todos los registros.
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_tenant_isolation ON audit_log
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));