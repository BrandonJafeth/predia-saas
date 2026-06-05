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

## Architecture

NestJS v11 API — part of `predia-saas` pnpm monorepo (sibling packages: `predia-front`, `predia-website`). Real estate SaaS platform (multi-tenant).

```
src/
├── main.ts              # Bootstrap; PORT env var (default 3000); global ValidationPipe
├── app.module.ts        # Root module — assembler only (ConfigModule, PrismaModule, HealthModule)
├── prisma/
│   ├── schema.prisma    # Prisma schema (no url — provided via adapter at runtime)
│   ├── migrations/      # Auto-generated migration SQL files
│   ├── prisma.service.ts
│   └── prisma.module.ts # @Global() — PrismaService available everywhere
├── health/
│   ├── health.controller.ts  # GET /health → { status: 'ok' } + SELECT 1
│   └── health.module.ts
├── modules/             # Feature modules (domain-driven)
│   ├── auth/
│   ├── tenants/
│   ├── users/
│   ├── properties/
│   ├── categories/
│   ├── locations/
│   ├── leads/
│   ├── payments/
│   ├── subscriptions/
│   └── public-api/
├── common/
│   ├── decorators/
│   └── guards/
└── config/

prisma.config.ts         # Prisma CLI config (schema path, migrations path, DATABASE_URL for CLI)
generated/prisma/        # Auto-generated Prisma client (gitignored, recreated by postinstall)
```

## Prisma 7 specifics

This project uses Prisma 7 which differs from Prisma 5/6:
- **No `url` in `schema.prisma`** — datasource URL lives in `prisma.config.ts` (for CLI) and is passed via driver adapter in `PrismaService` (for runtime)
- **Driver adapter**: `PrismaPg` from `@prisma/adapter-pg` wraps the `pg` connection pool
- **`PrismaService`** injects `ConfigService` to get `DATABASE_URL` and creates the adapter
- **`prisma.config.ts`** uses `import "dotenv/config"` to load `.env` for the CLI

**Adding a new feature module**: create `src/modules/<name>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`. Inject `PrismaService` directly (global — no need to import PrismaModule). Register the module in `app.module.ts`.

**Testing**: Unit tests co-located (`*.spec.ts`). E2E tests in `test/` using `jest-e2e.json` config.

**TypeScript**: `nodenext` module resolution, ES2023 target, decorators enabled, strict null checks.
