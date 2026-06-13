-- =============================================================================
-- PREDIA — Post-Migrate Script (solo Docker)
-- =============================================================================
-- Ejecutar UNA SOLA VEZ después de correr las migraciones de Prisma.
-- Solo aplica para el setup con Docker. Para setup local usar rls-setup.sql.
--
-- Uso (PowerShell desde predia-api/):
--   Get-Content ..\infra\postgres\post-migrate.sql | docker exec -i predia_postgres psql -U postgres -d predia
--
-- Cuándo re-ejecutar:
--   - Solo si se hizo docker compose down -v y se recreó el contenedor.
--   - Para tablas nuevas NO hace falta — el event trigger en init.sql las cubre.
--
-- Es idempotente: se puede correr varias veces sin errores.
-- =============================================================================

-- ─── Grants sobre tablas existentes ──────────────────────────────────────────
-- init.sql cubre DEFAULT PRIVILEGES para tablas FUTURAS.
-- Este bloque cubre las tablas que Prisma ya creó con migrate deploy.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_system;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_system;


-- ─── audit_log — override: append-only + solo FOR SELECT ─────────────────────
-- El event trigger en init.sql crea una policy FOR ALL en audit_log.
-- Acá se reemplaza por FOR SELECT y se revoca UPDATE/DELETE (append-only).

REVOKE UPDATE, DELETE ON audit_log FROM predia_app;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON audit_log;
CREATE POLICY tenant_isolation ON audit_log
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Nota: "User" tiene RLS en la migración 20260605220000_rls_tenant_isolation.
-- tenant_sites y demás tablas con tenant_id reciben RLS del trigger automáticamente.
