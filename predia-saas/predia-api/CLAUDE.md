# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm run dev            # dev with watch mode
pnpm run build          # compile to dist/
pnpm run start:prod     # run compiled dist/main
pnpm run test           # Jest unit tests
pnpm run test:e2e       # E2E tests (test/ dir)
pnpm run test:cov       # coverage report
pnpm run lint           # ESLint with auto-fix
pnpm run format         # Prettier format
```

Run single test file: `pnpm run test -- path/to/file.spec.ts`

Prisma commands (run from `predia-api/`):
```bash
node_modules/.bin/prisma migrate dev --name <name>   # new migration
node_modules/.bin/prisma generate                    # regenerate client after schema change
node_modules/.bin/prisma studio                      # GUI to browse DB
```

Scripts:
```bash
npx ts-node src/scripts/seed-superadmin.ts    # seed initial super_admin
npx ts-node src/scripts/seed-locations.ts     # seed CR provinces/cantons/districts (idempotent)
npx ts-node src/scripts/seed-categories.ts    # seed initial categories (idempotent, upsert by slug)
npx ts-node src/scripts/generate-openapi.ts   # export OpenAPI JSON
```

## Architecture

NestJS v11 API — part of `predia-saas` pnpm monorepo (sibling packages: `predia-front`, `predia-website`). Real estate SaaS platform (multi-tenant).

```
src/
├── main.ts                        # Bootstrap; CORS, cookie-parser, ValidationPipe, Swagger at /docs
├── app.module.ts                  # Root module — global guards + TenantInterceptor registered here
├── prisma/
│   ├── schema.prisma              # Prisma schema (no url — provided via adapter at runtime)
│   ├── migrations/                # Auto-generated migration SQL files
│   ├── prisma.service.ts          # Tenant DB — extends PrismaClient, injects ALS tenant context
│   ├── prisma.module.ts           # @Global() — PrismaService available everywhere
│   ├── system-prisma.service.ts   # System DB — plain PrismaClient on SYSTEM_DATABASE_URL
│   └── system-prisma.module.ts    # Provides SystemPrismaService (imported only by SystemModule)
├── health/
│   ├── health.controller.ts       # GET /health → { status: 'ok' } + SELECT 1
│   └── health.module.ts
├── modules/
│   ├── auth/                      # POST /auth/register|login|logout|refresh
│   │   ├── auth.controller.ts     # Refresh token → httpOnly cookie; access token → body
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── interfaces/
│   │   │   └── jwt-payload.interface.ts  # { sub, tenantId, role }
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       └── auth-response.dto.ts      # { accessToken }
│   ├── system/                    # Super-admin operations on system DB
│   │   ├── system.controller.ts   # GET /system/users, GET /system/tenants/:id/users, POST /system/superadmins
│   │   ├── system.service.ts      # Uses SystemPrismaService
│   │   ├── system.module.ts
│   │   └── dto/
│   │       └── create-superadmin.dto.ts
│   ├── tenants/                   # CRUD /api/v1/tenants — super_admin only
│   │   ├── tenants.controller.ts
│   │   ├── tenants.service.ts
│   │   ├── tenants.module.ts
│   │   └── dto/
│   │       ├── create-tenant.dto.ts
│   │       └── update-tenant.dto.ts
│   ├── users/                     # CRUD /api/v1/users — tenant-scoped
│   │   ├── users.controller.ts    # suspend/activate use SystemPrismaService when super_admin
│   │   ├── users.service.ts
│   │   ├── users.module.ts        # imports SystemPrismaModule
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       └── user-response.dto.ts
│   └── locations/                 # GET /api/v1/locations — catalog data (no RLS)
│       ├── locations.controller.ts
│       ├── locations.service.ts
│       ├── locations.module.ts
│       └── dto/
│           └── location-response.dto.ts
├── common/
│   ├── als/
│   │   └── tenant.store.ts        # AsyncLocalStorage<{ tenantId }> — singleton exported as `tenantStore`
│   ├── decorators/
│   │   ├── public.decorator.ts    # @Public() — bypasses JwtAuthGuard
│   │   ├── roles.decorator.ts     # @Roles(...UserRole) — used with RolesGuard
│   │   ├── current-user.decorator.ts   # @CurrentUser() → JwtPayload from request
│   │   └── current-tenant.decorator.ts # @CurrentTenant() → tenantId string from JWT
│   ├── guards/
│   │   ├── jwt-auth.guard.ts      # Global — protects all routes; respects @Public()
│   │   └── roles.guard.ts         # Global — enforces @Roles(); no @Roles() = any authenticated
│   ├── interceptors/
│   │   └── tenant.interceptor.ts  # Global — reads tenantId from JWT, sets tenantAls store
│   └── dto/
│       ├── page-options.dto.ts    # { page, limit } — query params for pagination
│       ├── page-meta.dto.ts       # { page, limit, total, totalPages }
│       └── page.dto.ts            # PageOf<T> generic — { data: T[], meta: PageMeta }
├── config/
│   └── swagger.ts                 # buildSwaggerConfig() — Swagger/OpenAPI setup
└── scripts/
    ├── seed-superadmin.ts
    ├── seed-locations.ts      # CR provinces/cantons/districts from ubicaciones.paginasweb.cr
    └── generate-openapi.ts

prisma.config.ts         # Prisma CLI config (schema path, migrations path, DATABASE_URL for CLI)
generated/prisma/        # Auto-generated Prisma client (gitignored, recreated by postinstall)
```

## Environment variables

```
DATABASE_URL          # Tenant PostgreSQL DB (used by PrismaService)
SYSTEM_DATABASE_URL   # System PostgreSQL DB (used by SystemPrismaService)
JWT_SECRET            # Min 32 chars — signs access tokens
JWT_REFRESH_SECRET    # Min 32 chars — signs refresh tokens
PORT                  # Default 3000
NODE_ENV              # development | production | test
CORS_ORIGIN           # Default http://localhost:5173 — comma-separated for multiple
```

## Prisma 7 specifics

Uses Prisma 7 (differs from 5/6):
- **No `url` in `schema.prisma`** — datasource URL lives in `prisma.config.ts` (CLI) and driver adapter (runtime)
- **Driver adapter**: `PrismaPg` from `@prisma/adapter-pg` wraps `pg` connection pool
- **`prisma.config.ts`** uses `import "dotenv/config"` to load `.env` for the CLI

## Multi-tenant isolation

Row-level isolation via PostgreSQL `set_config`:
1. `TenantInterceptor` (global) reads `tenantId` from JWT payload → stores in `tenantStore` (AsyncLocalStorage)
2. `PrismaService.$extends` wraps every query in a transaction: runs `SELECT set_config('app.current_tenant_id', tenantId, true)` before the actual query
3. PostgreSQL RLS policies read `current_setting('app.current_tenant_id')` to filter rows

`SystemPrismaService` connects via `SYSTEM_DATABASE_URL` (role `predia_system`, `BYPASSRLS`) — no ALS, no tenant scoping. Used by `SystemModule` and `TenantsModule`.

> **RLS gotcha:** `PrismaService` sets `app.current_tenant_id` from the caller's JWT. If an operation inserts rows with a `tenant_id` different from the caller's (e.g. super_admin creating a new tenant + admin user), the RLS policy blocks the INSERT with code `42501`. Use `SystemPrismaService` for those operations.

## Auth flow

- **Access token**: short-lived JWT in `Authorization: Bearer` header; payload = `{ sub, tenantId, role }`
- **Refresh token**: long-lived JWT in `refreshToken` httpOnly cookie (7 days)
- `POST /auth/refresh` — reads cookie, issues new pair
- `POST /auth/logout` — clears cookie

## Global guards & decorators

All routes protected by `JwtAuthGuard` by default. Opt out with `@Public()`.

`RolesGuard` runs after `JwtAuthGuard`. No `@Roles()` = any authenticated user passes. Add `@Roles(UserRole.admin)` to restrict.

`UserRole` enum (from Prisma): `super_admin | admin | agent`

`UserStatus` enum (from Prisma): `active | suspended | invited | deactivated`
- Suspended users are blocked at every layer: lookup, login, refresh, and per-request guard check.
- Auth errors always return generic messages — never reveal whether an account exists or its status.
- `PATCH /api/v1/users/:id/suspend` and `PATCH /api/v1/users/:id/activate` require `admin` or `super_admin`.
- When caller is `super_admin`, these endpoints use `SystemPrismaService` (bypasses RLS) to operate on users of any tenant.

## Pagination pattern

Controllers accept `@Query() pageOptionsDto: PageOptionsDto` → pass to service.  
Services return `PageOf<T>` (uses `PageMetaDto` internally).  
`PageOptionsDto` exposes `.skip` getter for Prisma `skip`.

## Adding a new feature module

1. Create `src/modules/<name>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`
2. Inject `PrismaService` directly (global — no need to import `PrismaModule`)
3. Use `@CurrentTenant()` to get `tenantId` for tenant-scoped operations
4. Apply `@Roles()` as needed; use `@Public()` only on auth-style endpoints
5. Register module in `app.module.ts`

### Checklist completo para funcionalidad nueva

#### Prisma / DB
- [ ] Agregar modelo en `schema.prisma` con todos los campos tipados
- [ ] Agregar `@@index` para campos usados en `where` frecuentes (ej. `tenant_id`, `created_at`)
- [ ] Si la tabla es tenant-scoped: agregar RLS policy en `rls-setup.sql` (`ENABLE ROW LEVEL SECURITY` + `CREATE POLICY ... USING (tenant_id = current_setting('app.current_tenant_id', true))`)
- [ ] Correr `prisma migrate dev --name <nombre-descriptivo>`
- [ ] Correr `prisma generate` después de cualquier cambio al schema
- [ ] Si la tabla es append-only (como `audit_log`): agregar `REVOKE UPDATE, DELETE ON <tabla> FROM predia_app` en `rls-setup.sql`

#### DTOs
- [ ] Todos los campos con `@ApiProperty` o `@ApiPropertyOptional` (Swagger los requiere)
- [ ] Campos opcionales con `@IsOptional()` + tipo `?: T`
- [ ] Validadores de `class-validator` en todos los campos de entrada (`@IsString`, `@IsUUID`, `@IsEmail`, `@IsEnum`, `@IsDateString`, etc.)
- [ ] DTOs de respuesta con `!` (non-null assertion) — son shapes de salida, no de entrada
- [ ] Response DTOs no extienden `PageOptionsDto` — solo los de query params lo hacen

#### Controller
- [ ] `@ApiTags('NombreModulo')` en la clase
- [ ] `@ApiBearerAuth()` en la clase (excepto `@Public()`)
- [ ] `@ApiOkResponse({ type: ... })` o `@ApiCreatedResponse` en cada handler
- [ ] `@Roles(UserRole.xxx)` en handlers o en la clase entera
- [ ] `@AuditLog({ action, entity })` en **todo endpoint que mute datos** (ver tabla abajo)
- [ ] Usar `@CurrentTenant()` para operaciones tenant-scoped, nunca leer `tenantId` del body

#### Service
- [ ] Usar `PrismaService` (tenant-scoped con RLS) para operaciones del tenant
- [ ] Usar `SystemPrismaService` solo si la operación es genuinamente cross-tenant (ej. audit log write, superadmin ops)
- [ ] **Importante RLS:** Cualquier operación que inserte/actualice filas con un `tenant_id` distinto al del JWT del caller (ej. super_admin creando tenants/usuarios) DEBE usar `SystemPrismaService`. `PrismaService` setea `app.current_tenant_id` al tenantId del caller; si el registro tiene un tenant_id diferente, la policy RLS bloquea con código `42501`.
- [ ] Paginación: recibir `PageOptionsDto`, devolver `PageDto<T>` con `PageMetaDto`
- [ ] Errores: lanzar `NotFoundException`, `ConflictException`, etc. de `@nestjs/common` — nunca exponer errores internos

#### Module
- [ ] Registrar en `app.module.ts`
- [ ] Exportar el service si otros módulos lo necesitan (ej. `AuditLogModule` exporta `AuditLogService`)
- [ ] Importar `SystemPrismaModule` si el service usa `SystemPrismaService`

---

## Audit Log — qué requiere @AuditLog()

`@AuditLog({ action, entity })` va en el **controller handler**, no en el servicio. El interceptor lo captura automáticamente al terminar con éxito.

### Regla general
Cualquier endpoint que **cree, modifique o elimine** un recurso persistente.

### Tabla de acciones válidas

| `action` | Cuándo usarlo |
|----------|--------------|
| `CREATE` | POST que crea un recurso |
| `UPDATE` | PATCH/PUT que modifica campos |
| `DELETE` | DELETE que elimina |
| `SUSPEND` | Acción que suspende/desactiva sin borrar |
| `ACTIVATE` | Acción que reactiva un recurso suspendido |
| `ROLE_CHANGE` | PATCH que cambia el rol de un usuario (puede usar `UPDATE` si no hay handler dedicado) |
| `REVOKE` | Revocación de API key u otro token |

### Endpoints con @AuditLog hoy

| Controller | Método | action | entity |
|-----------|--------|--------|--------|
| `UsersController` | `POST /api/v1/users` | `CREATE` | `user` |
| `UsersController` | `PATCH /api/v1/users/:id` | `UPDATE` | `user` |
| `UsersController` | `DELETE /api/v1/users/:id` | `DELETE` | `user` |
| `UsersController` | `PATCH /api/v1/users/:id/suspend` | `SUSPEND` | `user` |
| `UsersController` | `PATCH /api/v1/users/:id/activate` | `ACTIVATE` | `user` |
| `TenantsController` | `POST /api/v1/tenants` | `CREATE` | `tenant` |
| `TenantsController` | `PATCH /api/v1/tenants/:id` | `UPDATE` | `tenant` |
| `TenantsController` | `DELETE /api/v1/tenants/:id` | `DELETE` | `tenant` |
| `SystemController` | `POST /system/superadmins` | `CREATE` | `super_admin` |

### Endpoints que NO usan @AuditLog (y por qué)

| Endpoint | Razón |
|----------|-------|
| `GET *` | Solo lectura |
| `POST /auth/login` | `@Public()` — no hay JWT al momento del intercept; el `user` es `null` |
| `POST /auth/logout` | Retorna `void` (204); sin entity_id. Auditar requeriría llamada directa al service |
| `POST /auth/register` | Igual que login — no hay JWT todavía |
| `POST /auth/refresh` | Operación técnica de token, no acción de negocio |

### Para futuros módulos

Cuando agregues `properties`, `leads`, `api_keys`, etc.:
```ts
// properties
@AuditLog({ action: 'CREATE',  entity: 'property' })
@AuditLog({ action: 'UPDATE',  entity: 'property' })
@AuditLog({ action: 'DELETE',  entity: 'property' })
@AuditLog({ action: 'SUSPEND', entity: 'property' })

// leads
@AuditLog({ action: 'CREATE', entity: 'lead' })
@AuditLog({ action: 'UPDATE', entity: 'lead' })
@AuditLog({ action: 'DELETE', entity: 'lead' })

// api_keys
@AuditLog({ action: 'CREATE', entity: 'api_key' })
@AuditLog({ action: 'REVOKE', entity: 'api_key' })
```

### Limitación del interceptor: entity_id
El interceptor extrae el `entity_id` de `responseData.id` o `request.params.id`.
- Si el handler devuelve el objeto creado/actualizado con `.id` → funciona automáticamente
- Si el handler devuelve `void` o un objeto sin `.id` → el `entity_id` queda como `'unknown'`; en ese caso auditar directamente llamando `auditLogService.log()` desde el service

## Catalog / reference data (no tenant scope)

Tables `locations` and `categories` are global reference data — **no `tenant_id`, no RLS**.
Any role can read them; writes are super_admin only (or via seed scripts).

### Location hierarchy (Costa Rica)
- `LocationType` enum: `province | canton | district`
- Postal code pattern stored in `code`: `PCCDD` (5 digits) — province `P0000`, canton `PCC00`, district `PCCDD`
- 573 records seeded: 7 provinces, 82 cantons, 484 districts
- Source: `https://ubicaciones.paginasweb.cr` — seed is idempotent (`upsert` by `code`)
- Self-referencing FK: `parent_id → Location.id`

### Category
- `attribute_schema: Json` — JSONB column storing the JSON Schema for property attributes per category
- `slug` is unique — use as stable identifier across environments

## Swagger

Available at `http://localhost:3000/docs`. All controllers use `@ApiTags`, `@ApiBearerAuth`, and response decorators. DTOs use `@ApiProperty`.

## Testing

Unit tests co-located (`*.spec.ts`). E2E tests in `test/` using `jest-e2e.json` config.

## TypeScript

`nodenext` module resolution, ES2023 target, decorators enabled, strict null checks.
