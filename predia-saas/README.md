# Predia SaaS — Monorepo

Plataforma SaaS de bienes raíces multi-tenant. Monorepo pnpm con tres paquetes:

| Paquete | Descripción | Puerto |
|---|---|---|
| `predia-api` | Backend NestJS + Prisma + PostgreSQL | 3000 |
| `predia-front` | Frontend React + Vite + TanStack Router | 5173 |
| `predia-website` | Landing page | — |

---

## Requisitos

- **Node.js** >= 20
- **pnpm** >= 9 — `npm install -g pnpm`
- **PostgreSQL** >= 15

---

## 1. Instalar dependencias

```bash
# Desde la raíz del monorepo
pnpm install
```

---

## 2. Configurar PostgreSQL

Conectarse como superuser de postgres (psql, pgAdmin, DBeaver, etc.) y ejecutar:

```sql
-- Crear base de datos
CREATE DATABASE predia;

-- Crear rol de la app (acceso normal, sujeto a RLS)
CREATE ROLE predia_app WITH
  LOGIN
  PASSWORD 'tu_password_app'
  NOBYPASSRLS
  NOCREATEDB
  NOCREATEROLE;

-- Crear rol del sistema (superadmin, bypasea RLS para queries cross-tenant)
CREATE ROLE predia_system WITH
  LOGIN
  PASSWORD 'tu_password_system'
  BYPASSRLS
  NOCREATEDB
  NOCREATEROLE;

-- Conectarse a la DB predia para dar permisos
\c predia

-- Permisos para predia_app
GRANT CONNECT ON DATABASE predia TO predia_app;
GRANT USAGE ON SCHEMA public TO predia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO predia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO predia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO predia_app;

-- Permisos para predia_system
GRANT CONNECT ON DATABASE predia TO predia_system;
GRANT USAGE ON SCHEMA public TO predia_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_system;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO predia_system;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO predia_system;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO predia_system;
```

> **Por qué dos roles:** `predia_app` maneja queries de tenants normales bajo RLS. `predia_system` es exclusivo para endpoints de superadmin que necesitan leer datos de todos los tenants sin restricción de RLS.

---

## 3. Variables de entorno

Crear `predia-api/.env` (copiar de `.env.example` si existe, o crear manual):

```env
# Conexión normal de la app — sujeta a RLS
DATABASE_URL="postgresql://predia_app:tu_password_app@localhost:5432/predia?schema=public"

# Conexión del sistema — BYPASSRLS, solo para SystemModule
SYSTEM_DATABASE_URL="postgresql://predia_system:tu_password_system@localhost:5432/predia?schema=public"

# JWT — mínimo 32 caracteres cada uno
JWT_SECRET="cambia-esto-por-un-secreto-de-minimo-32-chars"
JWT_REFRESH_SECRET="cambia-esto-por-otro-secreto-de-minimo-32-chars"

# CORS — URL del frontend
CORS_ORIGIN="http://localhost:5173"
```

---

## 4. Ejecutar migraciones

```bash
cd predia-api
node_modules/.bin/prisma migrate deploy
```

Esto aplica todas las migraciones, incluyendo la de RLS (`20260605220000_rls_tenant_isolation`).

> **Nota:** Después de las migraciones, los permisos de tablas para `predia_system` se deben reasignar porque `GRANT ON ALL TABLES` solo aplica a tablas existentes en ese momento:
> ```sql
> -- Como superuser, en la DB predia
> GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_system;
> GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO predia_system;
> GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO predia_app;
> GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO predia_app;
> ```

---

## 5. Seed: crear primer superadmin

```bash
cd predia-api

# Opción A: argumentos
pnpm run seed:superadmin admin@predia.com password_minimo_12chars

# Opción B: env vars
SUPERADMIN_EMAIL=admin@predia.com \
SUPERADMIN_PASSWORD=password_minimo_12chars \
SUPERADMIN_FIRST_NAME=Predia \
SUPERADMIN_LAST_NAME=Admin \
pnpm run seed:superadmin
```

El script crea automáticamente el tenant del sistema (`predia-saas`) si no existe.

Para hacer login, usar `tenantSlug: predia-saas` en el endpoint de auth.

---

## 6. Levantar en desarrollo

```bash
# Terminal 1 — API
cd predia-api
pnpm run dev

# Terminal 2 — Frontend
cd predia-front
pnpm run dev
```

O desde la raíz del monorepo en paralelo:

```bash
pnpm --filter predia-api run dev &
pnpm --filter predia-front run dev
```

---

## 7. Comandos útiles

### API (`predia-api/`)

```bash
pnpm run dev              # dev con watch mode
pnpm run build            # compilar a dist/
pnpm run start:prod       # correr dist/main
pnpm run test             # Jest unit tests
pnpm run test:e2e         # E2E tests
pnpm run lint             # ESLint con auto-fix
pnpm run format           # Prettier

# Prisma
node_modules/.bin/prisma migrate dev --name <nombre>   # nueva migración
node_modules/.bin/prisma generate                      # regenerar cliente
node_modules/.bin/prisma studio                        # GUI para DB
```

### Frontend (`predia-front/`)

```bash
pnpm run dev              # dev server
pnpm run build            # build producción
pnpm run preview          # preview del build
pnpm run lint             # ESLint
```

---

## 8. Arquitectura de seguridad DB

```
Request HTTP
  └─ JWT Guard → extrae tenantId del token
       └─ TenantInterceptor → guarda tenantId en AsyncLocalStorage
            └─ PrismaService (predia_app)
                 └─ Extension: SET app.current_tenant_id = tenantId
                      └─ RLS policy filtra por tenant_id = current_setting(...)

Endpoints /system/* (solo super_admin)
  └─ SystemPrismaService (predia_system — BYPASSRLS)
       └─ Ignora RLS → accede a todos los tenants
```

---

## 9. Swagger / OpenAPI

Con la API corriendo: [http://localhost:3000/api](http://localhost:3000/api)
