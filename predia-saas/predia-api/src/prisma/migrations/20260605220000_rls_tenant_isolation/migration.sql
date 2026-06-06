-- RLS: tenant isolation for all tenant-scoped tables.
-- Runs automatically via `prisma migrate deploy`.
-- IMPORTANT: For RLS to be enforced in production, the app must connect with
-- a non-superuser role (NOBYPASSRLS). See rls-setup.sql for role creation steps.

-- ─── User table ──────────────────────────────────────────────────────────────

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "User";

CREATE POLICY "tenant_isolation" ON "User"
  FOR ALL
  USING  (tenant_id = current_setting('app.current_tenant_id', TRUE))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE));
