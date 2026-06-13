-- =============================================================================
-- PREDIA — Init Script (auto-ejecutado por Docker al crear el contenedor)
-- =============================================================================
-- NO editar para setup manual. Para setup sin Docker usar rls-setup.sql.
-- Este script corre como el usuario "postgres" contra la DB "predia".
-- =============================================================================

-- ─── Roles ───────────────────────────────────────────────────────────────────

-- predia_app: rol de la app (tenant DB). NOBYPASSRLS = RLS siempre activo.
CREATE ROLE predia_app LOGIN PASSWORD 'predia_app' NOBYPASSRLS;

-- predia_system: rol de operaciones cross-tenant (superadmin). BYPASSRLS.
CREATE ROLE predia_system LOGIN PASSWORD 'predia_system' BYPASSRLS;


-- ─── Permisos de conexión y schema ───────────────────────────────────────────

GRANT CONNECT ON DATABASE predia TO predia_app;
GRANT CONNECT ON DATABASE predia TO predia_system;

GRANT USAGE ON SCHEMA public TO predia_app;
GRANT USAGE ON SCHEMA public TO predia_system;


-- ─── DEFAULT PRIVILEGES — tablas futuras (creadas por Prisma Migrate) ────────
-- Cada nueva tabla queda con permisos correctos sin intervención manual.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO predia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO predia_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO predia_system;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO predia_system;


-- ─── Event Trigger — RLS automático para tablas con tenant_id ────────────────
-- Dispara en cada CREATE TABLE. Si la tabla tiene columna tenant_id:
--   - activa ENABLE ROW LEVEL SECURITY
--   - crea policy "tenant_isolation" que filtra por current_setting('app.current_tenant_id')
-- Tablas sin tenant_id no se modifican.

CREATE OR REPLACE FUNCTION auto_rls_tenant_tables()
RETURNS event_trigger AS $$
DECLARE
  obj      record;
  has_col  boolean;
BEGIN
  FOR obj IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
      AND schema_name = 'public'
  LOOP
    -- pg_attribute es más confiable que information_schema dentro de event triggers
    SELECT EXISTS (
      SELECT 1 FROM pg_attribute
      WHERE attrelid = obj.objid
        AND attname   = 'tenant_id'
        AND attnum    > 0
        AND NOT attisdropped
    ) INTO has_col;

    IF has_col THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', obj.objid::regclass);
      EXECUTE format(
        $q$CREATE POLICY tenant_isolation ON %I
          USING (tenant_id = current_setting('app.current_tenant_id', true))$q$,
        obj.objid::regclass
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE EVENT TRIGGER auto_rls_tenant_tables
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION auto_rls_tenant_tables();
