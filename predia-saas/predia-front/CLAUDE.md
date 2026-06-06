# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# From predia-front/
pnpm dev          # Vite dev server
pnpm build        # vite build + tsc -b
pnpm lint         # ESLint (flat config)
pnpm preview      # Preview production build

# From monorepo root (predia-saas/)
pnpm dev:front    # Same as above but from root
pnpm dev:api      # NestJS backend
pnpm generate:api # Regenerate @predia/api-types from predia-api/openapi.json
```

No test runner configured yet.

## Architecture

**Stack:** React 19, TypeScript 6, Vite 8, TanStack Router (file-based), TanStack React Query 5, Tailwind CSS 4, Radix UI / shadcn-ui, React Compiler enabled.

**Monorepo:** pnpm workspace. Packages: `predia-api` (NestJS), `predia-front` (this), `predia-website`, `packages/api-types`.

### Routing

File-based via TanStack Router. Add a route by creating `src/routes/[name].tsx` — the plugin auto-regenerates `src/routeTree.gen.ts` (never edit by hand). Root layout (`src/routes/__root.tsx`) renders `AppLayout` for all routes except `/login` via a pathname check.

### Feature Modules

Pages live in `src/app/[feature]/components/[Feature]Page.tsx`. Each feature dir has placeholder dirs for `hooks/`, `services/`, `types/`. The `auth` module is the next one to implement; backend endpoints exist at `POST /auth/login`, `/auth/register`, `/auth/refresh`.

### API Client

`@predia/api-types` (workspace package) exports `createApiClient(baseUrl)` built on `openapi-fetch`. Types are generated from the backend's OpenAPI schema. Pattern:

```typescript
import { createApiClient } from '@predia/api-types'

const client = createApiClient(import.meta.env.VITE_API_URL)
const { data, error } = await client.GET('/api/v1/...', { params: { ... } })
```

Wire into React Query via hooks in `src/app/[feature]/hooks/`. Shared query client config is in `src/shared/lib/query.ts` (staleTime 5 min, retry 1, no refetchOnWindowFocus).

### Design System

- `src/design-system/ui/` — shadcn/ui + Radix primitives (18 components)
- `src/design-system/typography/` — Display / Heading / Text components (Inter font)
- `src/layouts/` — `AppLayout` (responsive sidebar + navbar), `AppLayoutSkeleton`
- Tailwind theme tokens in `src/index.css`; use `cn()` from `src/shared/lib/utils.ts` for class merging
- Path alias `@` → `src/`
