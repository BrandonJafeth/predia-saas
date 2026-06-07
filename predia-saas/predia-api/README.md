# predia-api

Backend del SaaS inmobiliario **Predia**. NestJS + Prisma 7 + PostgreSQL, multi-tenant con aislamiento por RLS.

---

## Stack

| Tecnología | Versión |
|---|---|
| NestJS | 11 |
| Prisma | 7 |
| PostgreSQL | 15+ |
| Node.js | 20+ |
| pnpm | 9+ |

---

## 1. Requisitos previos

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ corriendo localmente

---

## 2. Instalación

```bash
# Desde la raíz del monorepo
pnpm install

# O solo el API
cd predia-api
pnpm install
```

`postinstall` corre `prisma generate` automáticamente.

---

## 3. Variables de entorno

Crea `predia-api/.env` copiando esto y completando los valores:

```env
# Base de datos — tenant app (rol con NOBYPASSRLS)
DATABASE_URL=postgresql://predia_app:tu-password@localhost:5432/predia

# Base de datos — sistema (rol con BYPASSRLS, solo lectura + INSERT en User)
SYSTEM_DATABASE_URL=postgresql://predia_system:tu-password@localhost:5432/predia

# JWT — mínimo 32 caracteres cada uno
JWT_SECRET=cambia-esto-por-un-secreto-de-minimo-32-chars
JWT_REFRESH_SECRET=otro-secreto-diferente-de-minimo-32-chars

# Servidor
PORT=3000
NODE_ENV=development

# CORS — URL del frontend (separar con coma si son varias)
CORS_ORIGIN=http://localhost:5173
```

---

## 4. Setup de base de datos

### 4.1 Crear roles PostgreSQL

Corre esto **una sola vez** como superusuario (`postgres`):

```bash
psql -U postgres -d predia -f src/prisma/rls-setup.sql
```

O copia y pega directamente en psql:

```sql
-- Rol para la app (NOBYPASSRLS — RLS se aplica siempre)
CREATE ROLE predia_app LOGIN PASSWORD 'change-me-app' NOBYPASSRLS;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Tenant", "User" TO predia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_app;

-- Rol para sistema (BYPASSRLS — lee datos cross-tenant, escritura mínima)
CREATE ROLE predia_system LOGIN PASSWORD 'change-me-system' BYPASSRLS;
GRANT SELECT ON "Tenant", "User" TO predia_system;
GRANT INSERT ON "User" TO predia_system;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO predia_system;
```

> Actualiza `.env` con las contraseñas reales que pongas aquí.

### 4.2 Correr migraciones

```bash
node_modules/.bin/prisma migrate dev
```

Las migraciones crean las tablas `Tenant` y `User` y configuran RLS automáticamente.

---

## 5. Seed — crear primer superadmin

```bash
pnpm run seed:superadmin admin@predia.com MiPassword123!
```

O con variables de entorno:

```bash
SUPERADMIN_EMAIL=admin@predia.com \
SUPERADMIN_PASSWORD=MiPassword123! \
SUPERADMIN_FIRST_NAME=Admin \
SUPERADMIN_LAST_NAME=Predia \
pnpm run seed:superadmin
```

Esto crea el tenant del sistema (`predia-saas`) y el usuario `super_admin`.

> Requisitos: contraseña mínimo 12 caracteres.

---

## 6. Levantar el servidor

```bash
# Desarrollo (watch mode)
pnpm run dev

# Producción
pnpm run build
pnpm run start:prod
```

API disponible en `http://localhost:3000`
Swagger en `http://localhost:3000/docs`

---

## 7. Auth — flujo de login

```
POST /auth/login
Body: { "email": "...", "password": "..." }

Response:
  - accessToken (JWT corto) en body → usar como: Authorization: Bearer <token>
  - refreshToken (JWT largo) en cookie httpOnly → renovar con POST /auth/refresh
```

| Endpoint | Método | Auth | Descripción |
|---|---|---|---|
| `/auth/register` | POST | Público | Registrar usuario |
| `/auth/login` | POST | Público | Login → access + refresh token |
| `/auth/refresh` | POST | Cookie | Renovar access token |
| `/auth/logout` | POST | Cookie | Limpiar cookie |

---

## 8. Roles y permisos

| Rol | Acceso |
|---|---|
| `super_admin` | Endpoints `/system/*` y `/api/v1/tenants/*` |
| `admin` | CRUD usuarios de su tenant (`/api/v1/users/*`) |
| `agent` | Lectura usuarios de su tenant |

Todos los endpoints requieren JWT por defecto. Usar `@Public()` para rutas públicas.

---

## 9. Endpoints principales

| Ruta | Roles permitidos | Descripción |
|---|---|---|
| `GET /system/users` | super_admin | Listar todos los usuarios (cross-tenant) |
| `GET /system/tenants/:id/users` | super_admin | Usuarios de un tenant específico |
| `POST /system/superadmins` | super_admin | Crear superadmin |
| `GET /api/v1/tenants` | super_admin | Listar tenants |
| `POST /api/v1/tenants` | super_admin | Crear tenant |
| `PATCH /api/v1/tenants/:id` | super_admin | Actualizar tenant |
| `DELETE /api/v1/tenants/:id` | super_admin | Eliminar tenant |
| `GET /api/v1/users` | admin, agent | Listar usuarios del tenant |
| `POST /api/v1/users` | admin | Crear usuario en el tenant |
| `PATCH /api/v1/users/:id` | admin | Actualizar usuario |
| `DELETE /api/v1/users/:id` | admin | Eliminar usuario |
| `GET /health` | Público | Health check |

---

## 10. Comandos de referencia

```bash
# Desarrollo
pnpm run dev

# Tests
pnpm run test
pnpm run test:e2e
pnpm run test:cov

# Calidad de código
pnpm run lint
pnpm run format

# Prisma
node_modules/.bin/prisma migrate dev --name <nombre>   # nueva migración
node_modules/.bin/prisma generate                      # regenerar cliente
node_modules/.bin/prisma studio                        # GUI de base de datos

# Scripts
pnpm run seed:superadmin <email> <password>            # crear superadmin
pnpm run generate:openapi                              # exportar OpenAPI JSON
```

---

## 11. Estructura del proyecto

```
src/
├── main.ts                       # Bootstrap (CORS, cookies, Swagger, ValidationPipe)
├── app.module.ts                 # Guards globales + TenantInterceptor
├── prisma/
│   ├── prisma.service.ts         # DB tenant — inyecta tenant context via ALS
│   ├── system-prisma.service.ts  # DB sistema — BYPASSRLS, cross-tenant
│   └── rls-setup.sql             # Setup roles PostgreSQL (correr una vez)
├── modules/
│   ├── auth/                     # Login, registro, refresh
│   ├── system/                   # Gestión superadmin (usuarios globales)
│   ├── tenants/                  # CRUD tenants (solo super_admin)
│   └── users/                    # CRUD usuarios por tenant
└── common/
    ├── als/tenant.store.ts       # AsyncLocalStorage para contexto de tenant
    ├── decorators/               # @Public(), @Roles(), @CurrentUser(), @CurrentTenant()
    ├── guards/                   # JwtAuthGuard (global), RolesGuard (global)
    ├── interceptors/             # TenantInterceptor — propaga tenantId del JWT al ALS
    └── dto/                      # PageOptionsDto, PageOf<T>
```

---

## 12. Multi-tenant — cómo funciona

1. Login devuelve JWT con `{ sub, tenantId, role }` en payload
2. `TenantInterceptor` lee `tenantId` del JWT → lo guarda en `tenantStore` (AsyncLocalStorage)
3. `PrismaService` envuelve cada query con `SET LOCAL app.current_tenant_id = '<id>'`
4. RLS en PostgreSQL filtra filas donde `tenant_id = current_setting('app.current_tenant_id')`

| Rol DB | RLS | Uso |
|---|---|---|
| `predia_app` | NOBYPASSRLS (enforced) | App principal — queries tenant-scoped |
| `predia_system` | BYPASSRLS | Sistema — ve datos de todos los tenants |

---

## 13. Agregar un nuevo módulo

```bash
# 1. Crear archivos
src/modules/<nombre>/
  ├── <nombre>.module.ts
  ├── <nombre>.controller.ts
  └── <nombre>.service.ts

# 2. En el service, inyectar PrismaService directamente (es global)
constructor(private prisma: PrismaService) {}

# 3. Usar @CurrentTenant() para operaciones tenant-scoped
@Get()
findAll(@CurrentTenant() tenantId: string) { ... }

# 4. Registrar en app.module.ts
imports: [..., NombreModule]
```
