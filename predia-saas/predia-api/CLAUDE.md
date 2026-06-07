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
│   └── users/                     # CRUD /api/v1/users — tenant-scoped
│       ├── users.controller.ts    # Uses @CurrentTenant() to scope all operations
│       ├── users.service.ts
│       ├── users.module.ts
│       └── dto/
│           ├── create-user.dto.ts
│           ├── update-user.dto.ts
│           └── user-response.dto.ts
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

`SystemPrismaService` connects to a separate system DB — no ALS, no tenant scoping. Used exclusively by `SystemModule`.

## Auth flow

- **Access token**: short-lived JWT in `Authorization: Bearer` header; payload = `{ sub, tenantId, role }`
- **Refresh token**: long-lived JWT in `refreshToken` httpOnly cookie (7 days)
- `POST /auth/refresh` — reads cookie, issues new pair
- `POST /auth/logout` — clears cookie

## Global guards & decorators

All routes protected by `JwtAuthGuard` by default. Opt out with `@Public()`.

`RolesGuard` runs after `JwtAuthGuard`. No `@Roles()` = any authenticated user passes. Add `@Roles(UserRole.admin)` to restrict.

`UserRole` enum (from Prisma): `super_admin | admin | agent | client`

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

## Swagger

Available at `http://localhost:3000/docs`. All controllers use `@ApiTags`, `@ApiBearerAuth`, and response decorators. DTOs use `@ApiProperty`.

## Testing

Unit tests co-located (`*.spec.ts`). E2E tests in `test/` using `jest-e2e.json` config.

## TypeScript

`nodenext` module resolution, ES2023 target, decorators enabled, strict null checks.
