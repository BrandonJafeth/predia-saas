# Data, Query, And Contract Rules

Use for API client contracts, TanStack Query, mutations, auth boundaries, URL state, and client persistence.

## API Client Contracts

Flag:

- Direct `fetch` or `axios` calls bypassing `createApiClient` from `@predia/api-types`.
- Re-declared API DTOs in components instead of importing generated types.
- Hardcoded API base URLs instead of `import.meta.env.VITE_API_URL`.
- Manual type assertions on API responses when generated types from `@predia/api-types` exist.

Use `createApiClient(import.meta.env.VITE_API_URL)` for all requests. Types are generated from the backend OpenAPI schema — import them, do not redeclare.

## Queries

Flag:

- `enabled` used to hide missing required input instead of skipping the query.
- Fake fallback IDs or placeholder inputs used to force a query to run.
- Query results copied into local state for rendering.
- Shared query behavior (invalidation, stale defaults, retry) reimplemented at call sites.
- Query staleTime / retry / refetchOnWindowFocus overridden at call sites without a documented reason.

Shared query client config lives in `src/shared/lib/query.ts` (staleTime 5 min, retry 1, no refetchOnWindowFocus). Wire API calls into React Query via feature hooks in `src/app/[feature]/hooks/`.

## Mutations

Flag:

- `mutateAsync` used without Promise semantics need.
- Awaited mutations without `try/catch`.
- Components owning shared cache invalidation that belongs in a shared mutation hook.
- Optimistic updates that do not match current list/detail query keys.

Put shared cache invalidation behavior in feature hooks, not in components.

## Auth Boundaries

Flag:

- Auth token reads outside `src/shared/lib/tokens.ts`.
- Route-level auth decisions made inside page components instead of route loaders or the root layout.
- Silent redirect to login on 401 implemented in multiple places instead of centrally in the API client.

Auth header injection and 401 handling belong in `src/shared/lib/api.ts`. Token storage belongs in `src/shared/lib/tokens.ts`.

## URL State And Local Storage

Flag:

- Shareable filters, tabs, pagination, or search state hidden only in component state.
- One-shot navigation signals modeled as subscribed persistent state.
- Live app state stored in `localStorage`.
- Direct `window.localStorage` or raw storage calls in feature code.
- High-frequency interaction state persisted on every change instead of on commit/settle.

Use TanStack Router search params for shareable UI state. Use component state for transient interaction state. Use `localStorage` only for low-frequency client-only preferences or dismissed notices.
