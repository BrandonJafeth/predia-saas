-- =============================================================================
-- PREDIA — Database Security Setup (setup manual sin Docker)
-- =============================================================================
-- Si usas Docker: infra/postgres/init.sql + post-migrate.sql lo hacen
-- automáticamente. Este archivo es para entornos sin Docker (CI, VPS, producción,
-- o dev local con Postgres instalado).
--
-- ORDEN OBLIGATORIO — no saltear pasos:
--   1. Ejecutar PASO 1  (roles + default privileges + event trigger)
--   2. Copiar credenciales a .env y agregar MIGRATION_URL
--   3. node_modules/.bin/prisma migrate deploy
--   4. Ejecutar PASO 2  (grants sobre tablas existentes + audit_log)
--
-- Por qué el trigger va en PASO 1:
--   El trigger debe existir ANTES de que Prisma cree las tablas (paso 3).
--   Si se crea después, las tablas no reciben RLS automáticamente.
--
-- Idempotente: se puede re-ejecutar cada PASO sin romper nada.
-- =============================================================================


-- =============================================================================
-- PASO 1 — Ejecutar ANTES de las migraciones de Prisma
-- =============================================================================

-- Si la DB no existe todavía:
--   CREATE DATABASE predia;
-- Conectarse a la DB antes de continuar (en psql interactivo: \c predia)

-- ─── Roles ───────────────────────────────────────────────────────────────────

-- predia_app: NOBYPASSRLS garantiza que RLS se aplique siempre.
CREATE ROLE predia_app LOGIN PASSWORD 'change-me-app' NOBYPASSRLS;

-- predia_system: BYPASSRLS permite leer/escribir datos de cualquier tenant.
CREATE ROLE predia_system LOGIN PASSWORD 'change-me-system' BYPASSRLS;

GRANT CONNECT ON DATABASE predia TO predia_app;
GRANT CONNECT ON DATABASE predia TO predia_system;

GRANT USAGE ON SCHEMA public TO predia_app;
GRANT USAGE ON SCHEMA public TO predia_system;


-- ─── Default privileges — tablas futuras ─────────────────────────────────────
-- Cada tabla que Prisma Migrate cree queda con permisos correctos automáticamente.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO predia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO predia_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO predia_system;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO predia_system;


-- ─── Event trigger — RLS automático ──────────────────────────────────────────
-- DEBE estar en PASO 1 para que dispare cuando Prisma crea las tablas (paso 3).
-- Cualquier tabla con columna tenant_id recibe ENABLE RLS + policy automáticamente.
-- Tablas sin tenant_id no se tocan.

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

-- DROP IF EXISTS para idempotencia (re-ejecución segura)
DROP EVENT TRIGGER IF EXISTS auto_rls_tenant_tables;

CREATE EVENT TRIGGER auto_rls_tenant_tables
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION auto_rls_tenant_tables();


-- =============================================================================
-- [ PAUSA ] — Actualizar .env con las 3 URLs, luego correr migraciones
-- =============================================================================
--
-- .env:
--   DATABASE_URL        = postgresql://predia_app:change-me-app@localhost:5432/predia
--   SYSTEM_DATABASE_URL = postgresql://predia_system:change-me-system@localhost:5432/predia
--   MIGRATION_URL       = postgresql://postgres:TU_PASSWORD@localhost:5432/predia
--
-- Terminal:
--   node_modules/.bin/prisma migrate deploy
--
-- Al correr las migraciones, el event trigger del PASO 1 ya está activo y
-- aplica RLS automáticamente a todas las tablas que tengan tenant_id.
-- =============================================================================


-- =============================================================================
-- PASO 2 — Ejecutar DESPUÉS de las migraciones de Prisma
-- =============================================================================

-- ─── Grants sobre tablas ya existentes ───────────────────────────────────────
-- Default privileges cubre tablas FUTURAS.
-- Este bloque cubre las tablas que Prisma acaba de crear.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_system;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_system;


-- ─── audit_log — override: append-only + solo FOR SELECT ─────────────────────
-- El trigger crea una policy FOR ALL. Acá se reemplaza por FOR SELECT
-- y se revoca UPDATE/DELETE para que sea append-only.

REVOKE UPDATE, DELETE ON audit_log FROM predia_app;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON audit_log;
CREATE POLICY tenant_isolation ON audit_log
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Nota: "User" tiene RLS en la migración 20260605220000_rls_tenant_isolation.
-- tenant_sites y demás tablas con tenant_id reciben RLS del trigger automáticamente.


-- =============================================================================
-- Verificación rápida (correr manualmente en psql)
-- =============================================================================
--
-- Roles:
--   SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname LIKE 'predia_%';
--
-- Tablas con RLS activo:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND rowsecurity = true;
--
-- Policies:
--   SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
--
-- Event trigger:
--   SELECT evtname, evtevent, evtenabled FROM pg_event_trigger;
-- =============================================================================
