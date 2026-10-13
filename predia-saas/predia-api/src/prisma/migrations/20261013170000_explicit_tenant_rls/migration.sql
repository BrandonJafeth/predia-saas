-- RLS explícito para todas las tablas con tenant_id.
--
-- Hasta ahora solo "User" y property_amenities tenían RLS en una migración;
-- el resto dependía del event trigger de infra/postgres/init.sql (o
-- rls-setup.sql). En una base gestionada sin superusuario (Supabase, RDS,
-- Neon...) no se pueden crear event triggers y esas tablas quedaban SIN
-- aislamiento, sin ningún error visible. Esta migración deja la garantía en
-- el historial de Prisma, independiente del trigger.
--
-- Idempotente: DROP POLICY IF EXISTS + CREATE. Las policies son idénticas a
-- las que crea el trigger, así que en entornos que ya lo tenían no cambia nada.

ALTER TABLE "tenant_sites" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "tenant_sites";
CREATE POLICY "tenant_isolation" ON "tenant_sites"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "properties";
CREATE POLICY "tenant_isolation" ON "properties"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "property_images" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "property_images";
CREATE POLICY "tenant_isolation" ON "property_images"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "property_amenities" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "property_amenities";
CREATE POLICY "tenant_isolation" ON "property_amenities"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "leads";
CREATE POLICY "tenant_isolation" ON "leads"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

ALTER TABLE "lead_activities" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "lead_activities";
CREATE POLICY "tenant_isolation" ON "lead_activities"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- audit_log: solo lectura para predia_app (las escrituras van por
-- SystemPrismaService / predia_system, que bypasea RLS). Mismo override que
-- post-migrate.sql / rls-setup.sql.
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "audit_log";
CREATE POLICY "tenant_isolation" ON "audit_log"
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));
