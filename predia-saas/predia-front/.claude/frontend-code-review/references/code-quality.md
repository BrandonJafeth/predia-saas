# Code Quality Rules

## Scope Control

Flag changes that expand beyond requested feature or review scope:

- Repo-wide cleanup mixed into a targeted fix.
- Compatibility exports, aliases, or shims added without an explicit migration requirement.
- Shared abstractions created before there is stable cross-feature reuse.
- Business components moved into `src/shared/` without a clear ownership boundary.

## TypeScript

Flag:

- `any` or broad `Record<string, any>` where generated API types from `@predia/api-types` or local domain types exist.
- Re-declared API shapes instead of importing generated or returned types.
- Weak route/query param typing that leaks `string | string[] | undefined` deep into components.
- Runtime wrappers added only to satisfy TypeScript when a narrower type boundary would preserve the existing runtime shape.

Prefer:

- Explicit domain names that match the API contract.
- Type narrowing at route/API boundaries.
- Small conversion helpers colocated with the component that needs them.

## Styling

Flag:

- New CSS modules or ad hoc CSS when Tailwind utilities and theme tokens from `src/index.css` cover the need.
- Hardcoded color, spacing, radius, shadow, z-index, or typography values when theme tokens or component variants exist.
- `!important` modifiers without a narrow, documented reason.
- Manual string concatenation for conditional classes.
- `className` prop placed before default classes in `cn(...)`, preventing call-site overrides.
- Arbitrary z-index fixes on overlay components.

Use:

- `cn()` from `src/shared/lib/utils.ts` for class merging.
- Tailwind v4 utilities and theme tokens from `src/index.css`.
- Existing component variants before one-off class forks.
- Radix `data-*` attribute selectors (`data-disabled:*`, `data-open:*`, `data-highlighted:*`) before adding React state or boolean props solely for styling.

## Imports

Flag:

- Cross-feature imports that bypass a feature's public barrel or `components/` index.
- Direct imports from `@predia/api-types` internal modules when the package's public surface covers the need.
- Barrel imports from heavy libraries when direct imports are available.
- `src/design-system/ui/` component internals imported instead of the component itself.

## Copy And Text

Flag:

- Hardcoded user-facing strings that should be constants or i18n keys if i18n is added later.
- Generic button labels like "Submit" where the action is specific (e.g., "Save Property", "Create Tenant").
- Error messages that state only the failure and not the next step for the user.
- Loading copy using `...` instead of `…` (ellipsis character).
- Hardcoded dates, times, or currency formats instead of `Intl.*`.
