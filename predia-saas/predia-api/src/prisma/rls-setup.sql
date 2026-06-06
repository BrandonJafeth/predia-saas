-- RLS setup for Predia multi-tenant isolation.
-- Run once after the schema is applied:
--   psql "postgresql://postgres:123456@localhost:5432/predia" -f prisma/rls-setup.sql
--
-- IMPORTANT: With the postgres superuser, RLS is bypassed automatically.
-- For production, connect as a role with NOBYPASSRLS:
--
--   CREATE ROLE predia_app LOGIN PASSWORD 'change-me' NOBYPASSRLS;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_app;
--   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_app;
--   Then set DATABASE_URL to use predia_app credentials.

-- ─── User table ──────────────────────────────────────────────────────────────

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- FORCE applies RLS even to the table owner (not superusers).
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "User";

-- When app.current_tenant_id is set, only rows matching that tenant are visible.
-- When the setting is absent/empty (NULL), all rows are blocked — intended for
-- a non-superuser app role. The postgres superuser ignores this policy.
CREATE POLICY "tenant_isolation" ON "User"
  FOR ALL
  USING  (tenant_id = current_setting('app.current_tenant_id', TRUE))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE));
