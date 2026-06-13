# predia-api

Backend del SaaS inmobiliario **Predia**. NestJS + Prisma 7 + PostgreSQL, multi-tenant con aislamiento por RLS.

---

## Stack

| Tecnología | Versión |
|---|---|
| NestJS | 11 |
| Prisma | 7 |
| PostgreSQL | 16 |
| Node.js | 20+ |
| pnpm | 9+ |
| Docker | 24+ (recomendado) |

---

## Setup inicial

Hay dos formas de correr la base de datos: **Docker (recomendado)** o **Postgres local**.

---

### Opción A — Docker (recomendado para el equipo)

Todos usan la misma versión de Postgres. Sin conflictos entre máquinas.

**Requisitos:** Docker Desktop instalado y corriendo.

> Docker expone Postgres en el puerto **5433** para evitar conflictos con instalaciones locales de PostgreSQL que usan 5432.

```powershell
# 1. Desde la raíz del monorepo — levantar Postgres
docker compose up -d

# 2. Instalar dependencias (desde predia-api/)
pnpm install

# 3. Copiar variables de entorno — las credenciales ya apuntan al contenedor Docker
cp .env.example .env
# Editar JWT_SECRET, JWT_REFRESH_SECRET y variables de email

# 4. Correr migraciones
node_modules/.bin/prisma migrate deploy

# 5. Aplicar grants y RLS en tablas existentes (UNA SOLA VEZ)
# PowerShell — usar Get-Content en lugar de <
Get-Content ..\infra\postgres\post-migrate.sql | docker exec -i predia_postgres psql -U postgres -d predia

# 6. Crear superadmin
npx ts-node src/scripts/seed-superadmin.ts admin@predia.com MiPassword123!

# 7. Levantar el servidor
pnpm run dev
```

> Si bajás el contenedor con `docker compose down` los datos **persisten** (volume Docker).
> Solo se pierden con `docker compose down -v`. Si hacés down -v, repetir pasos 4, 5 y 6.

---

### Opción B — Postgres local (sin Docker)

**Requisitos:** PostgreSQL 16+ instalado localmente.

```powershell
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno y ajustar credenciales locales
cp .env.example .env
# Cambiar las 3 URLs:
#   DATABASE_URL        → predia_app con tu password
#   SYSTEM_DATABASE_URL → predia_system con tu password
#   MIGRATION_URL       → postgres superuser (necesario para prisma migrate)

# 3. Crear la DB si no existe
# psql -U postgres -c "CREATE DATABASE predia;"

# 4. PASO 1 de rls-setup.sql — roles + default privileges + event trigger
# Abrir src/prisma/rls-setup.sql en psql y ejecutar solo la sección PASO 1.
# IMPORTANTE: el event trigger debe existir ANTES de correr las migraciones
# para que RLS se aplique automáticamente a las tablas cuando Prisma las crea.
psql -U postgres -d predia

# 5. Correr migraciones (el event trigger ya está activo — aplica RLS automáticamente)
node_modules/.bin/prisma migrate deploy

# 6. PASO 2 de rls-setup.sql — grants sobre tablas existentes + audit_log override
# Ejecutar solo la sección PASO 2 en psql.

# 7. Crear superadmin
npx ts-node src/scripts/seed-superadmin.ts admin@predia.com MiPassword123!

# 8. Levantar el servidor
pnpm run dev
```

> El archivo `src/prisma/rls-setup.sql` tiene los dos pasos claramente separados
> con una pausa en el medio. No correr el archivo completo de una sola vez —
> ejecutar PASO 1, salir, correr migraciones, volver y ejecutar PASO 2.

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
# Base de datos — Docker local (puerto 5433)
DATABASE_URL="postgresql://predia_app:predia_app@localhost:5433/predia"
SYSTEM_DATABASE_URL="postgresql://predia_system:predia_system@localhost:5433/predia"
MIGRATION_URL="postgresql://postgres:postgres@localhost:5433/predia"

# JWT — mínimo 32 caracteres cada uno
JWT_SECRET=cambia-esto-por-un-secreto-de-minimo-32-chars
JWT_REFRESH_SECRET=otro-secreto-diferente-de-minimo-32-chars

# Servidor
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@predia.com
EMAIL_FROM_NAME=Predia
EMAIL_ENABLED=true
```

| Variable | Quién la usa | Privilegios |
|---|---|---|
| `DATABASE_URL` | App en runtime (PrismaService) | DML — tenant-scoped con RLS |
| `SYSTEM_DATABASE_URL` | SystemPrismaService | DML — BYPASSRLS |
| `MIGRATION_URL` | `prisma migrate` CLI | DDL — superuser postgres |

---

## Comandos de referencia

```powershell
# Desarrollo
pnpm run dev              # watch mode
pnpm run build            # compilar a dist/
pnpm run start:prod       # correr dist/

# Tests
pnpm run test
pnpm run test:e2e
pnpm run test:cov

# Calidad
pnpm run lint
pnpm run format

# Prisma
node_modules/.bin/prisma migrate dev --name <nombre>   # nueva migración
node_modules/.bin/prisma migrate deploy                # aplicar migraciones
node_modules/.bin/prisma generate                      # regenerar cliente
node_modules/.bin/prisma studio                        # GUI de base de datos

# Scripts
npx ts-node src/scripts/seed-superadmin.ts <email> <password>
npx ts-node src/scripts/generate-openapi.ts

# Docker
docker compose up -d      # levantar Postgres en background
docker compose down       # bajar (datos persisten en volume)
docker compose down -v    # bajar y borrar datos
docker compose logs -f    # ver logs del contenedor

# PowerShell — ejecutar SQL contra el contenedor (no usar < en PowerShell)
Get-Content ..\infra\postgres\post-migrate.sql | docker exec -i predia_postgres psql -U postgres -d predia
```

---

## Auth — flujo de login

```
POST /auth/login
Body: { "email": "...", "password": "...", "tenantSlug": "..." }

Response:
  - accessToken (JWT corto) en body → Authorization: Bearer <token>
  - refreshToken (JWT largo) en cookie httpOnly → renovar con POST /auth/refresh
```

| Endpoint | Método | Auth | Descripción |
|---|---|---|---|
| `/auth/register` | POST | Público | Registrar usuario |
| `/auth/login` | POST | Público | Login |
| `/auth/refresh` | POST | Cookie | Renovar access token |
| `/auth/logout` | POST | Cookie | Limpiar cookie |
| `/auth/forgot-password` | POST | Público | Solicitar reset de contraseña |
| `/auth/reset-password` | POST | Público | Resetear contraseña con token |

---

## Roles y permisos

| Rol | Acceso |
|---|---|
| `super_admin` | `/system/*` y `/api/v1/tenants/*` |
| `admin` | CRUD usuarios y configuración de su tenant |
| `agent` | Lectura de recursos de su tenant |

Todos los endpoints requieren JWT. Usar `@Public()` para rutas públicas.

---

## Endpoints principales

| Ruta | Roles | Descripción |
|---|---|---|
| `GET /health` | Público | Health check |
| `GET /system/users` | super_admin | Todos los usuarios (cross-tenant) |
| `POST /system/superadmins` | super_admin | Crear superadmin |
| `GET /api/v1/tenants` | super_admin | Listar tenants |
| `POST /api/v1/tenants` | super_admin | Crear tenant |
| `PATCH /api/v1/tenants/:id` | super_admin | Actualizar tenant |
| `DELETE /api/v1/tenants/:id` | super_admin | Eliminar tenant |
| `GET /api/v1/users` | admin, agent | Listar usuarios del tenant |
| `POST /api/v1/users` | admin | Crear usuario |
| `PATCH /api/v1/users/:id` | admin | Actualizar usuario |
| `DELETE /api/v1/users/:id` | admin | Eliminar usuario |
| `GET /api/v1/tenant-sites` | admin, agent | Configuración del sitio del tenant |
| `POST /api/v1/tenant-sites` | admin | Crear configuración del sitio |
| `PATCH /api/v1/tenant-sites` | admin | Actualizar configuración del sitio |
| `DELETE /api/v1/tenant-sites` | admin | Eliminar configuración del sitio |
| `GET /api/v1/audit-log` | admin | Ver log de auditoría del tenant |

Swagger completo en `http://localhost:3000/docs`.

---

## Estructura del proyecto

```
predia-saas/
├── docker-compose.yml              # Postgres 16 — puerto 5433
├── infra/postgres/
│   ├── init.sql                    # Auto-ejecutado por Docker al crear el contenedor
│   └── post-migrate.sql            # Correr manualmente después de prisma migrate deploy
└── predia-api/
    └── src/
        ├── main.ts                 # Bootstrap (CORS, cookies, Swagger, ValidationPipe)
        ├── app.module.ts           # Guards globales + interceptors
        ├── prisma/
        │   ├── prisma.service.ts          # DB tenant — RLS via ALS
        │   ├── system-prisma.service.ts   # DB sistema — BYPASSRLS
        │   └── rls-setup.sql              # Setup manual sin Docker
        ├── modules/
        │   ├── auth/               # Login, registro, refresh, reset-password
        │   ├── system/             # Operaciones superadmin (cross-tenant)
        │   ├── tenants/            # CRUD tenants
        │   ├── users/              # CRUD usuarios por tenant
        │   ├── tenant-sites/       # Configuración del sitio por tenant
        │   ├── audit-log/          # Log de auditoría
        │   └── email/              # Servicio de emails (Resend)
        └── common/
            ├── als/                # AsyncLocalStorage — contexto de tenant
            ├── decorators/         # @Public(), @Roles(), @CurrentUser(), @CurrentTenant(), @AuditLog()
            ├── guards/             # JwtAuthGuard, RolesGuard (globales)
            ├── interceptors/       # TenantInterceptor, AuditLogInterceptor
            └── dto/                # PageOptionsDto, PageOf<T>
```

---

## Multi-tenant — cómo funciona

1. Login devuelve JWT con `{ sub, tenantId, role }` en payload
2. `TenantInterceptor` lee `tenantId` del JWT → guarda en `tenantStore` (AsyncLocalStorage)
3. `PrismaService` envuelve cada query en transacción: corre `SELECT set_config('app.current_tenant_id', tenantId, true)` antes del query real
4. RLS en PostgreSQL filtra filas donde `tenant_id = current_setting('app.current_tenant_id')`

| Rol DB | RLS | Uso |
|---|---|---|
| `predia_app` | NOBYPASSRLS | Queries tenant-scoped (app principal) |
| `predia_system` | BYPASSRLS | Superadmin ops, audit log writes |

Tablas nuevas con columna `tenant_id` reciben RLS automáticamente via event trigger (instalado en `init.sql` / `rls-setup.sql`).

---

## Agregar un nuevo módulo

```
src/modules/<nombre>/
  ├── <nombre>.module.ts
  ├── <nombre>.controller.ts
  ├── <nombre>.service.ts
  └── dto/
```

1. Inyectar `PrismaService` directamente (es global — no importar `PrismaModule`)
2. Usar `@CurrentTenant()` para todas las operaciones tenant-scoped
3. Aplicar `@Roles()` y `@AuditLog({ action, entity })` en handlers que muten datos
4. Registrar en `app.module.ts`

Ver checklist completo en `CLAUDE.md`.
