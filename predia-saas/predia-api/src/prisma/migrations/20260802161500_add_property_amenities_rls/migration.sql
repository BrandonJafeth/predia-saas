-- RLS directo para la tabla pivote property_amenities.
-- Depende SOLO de esta tabla (no del event trigger), para que el aislamiento
-- cross-tenant quede garantizado incluso en entornos sin el trigger instalado.
-- Idempotente: DROP IF EXISTS + CREATE permite re-ejecución segura.

ALTER TABLE "property_amenities" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON "property_amenities";
CREATE POLICY "tenant_isolation" ON "property_amenities"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
