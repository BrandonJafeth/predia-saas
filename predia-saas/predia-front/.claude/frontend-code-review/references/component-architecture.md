# Component Architecture Rules

Use for React component structure, ownership, state, props, effects, and module organization.

## Ownership

Flag:

- State, query, mutation, or handlers hoisted above the lowest component that actually uses them.
- Parent components owning row/item actions that do not coordinate a workflow.
- Prop drilling through multiple pass-through layers.
- A page/tab-level section becoming the data owner without needing shared snapshot or shared loading/error/empty UI.
- Feature code promoted to `src/shared/` before there is stable cross-feature reuse.

Accept repeated TanStack Query calls in siblings when each component independently consumes the data. Cache deduplication is not a reason to hoist.

## Feature Module Structure

Flag:

- Page components placed outside `src/app/[feature]/components/[Feature]Page.tsx`.
- API hooks placed outside `src/app/[feature]/hooks/`.
- Feature-specific types defined outside `src/app/[feature]/types/`.
- Services placed outside `src/app/[feature]/services/`.
- Cross-feature imports not going through a feature's public barrel.

## Component Boundaries

Flag:

- Shallow wrappers that only rename props or hide a real primitive.
- Extra DOM wrappers that do not provide layout, semantics, accessibility, state ownership, or library integration.
- Dialog/dropdown hidden surfaces that obscure the parent flow when they should be extracted into a small local component.
- Business forms or one-off helpers moved away from their owner without reuse or semantic value.

Prefer colocated components split by actual data and state needs.

## Bad Component Design Patterns

Flag:

- Components that mix data fetching, mutation side effects, popup state, form validation, layout, and row rendering without a clear owner.
- Generic components with many boolean props that encode one feature's workflow.
- A shared component that imports feature-specific copy, routes, or API contracts.
- A feature component that accepts pre-rendered fragments only to avoid placing ownership correctly.
- A child component receiving both raw server data and separately derived flags for the same concept.
- A wrapper that changes accessible semantics of the primitive it wraps.
- A component that exposes controlled props but still keeps a competing private state for the same value.

## Props And Types

Flag:

- `React.FC` / `FC`.
- Default exports outside TanStack Router route files (routes require default export).
- Props named by UI implementation instead of domain/API role.
- API data converted too early or under a generic name that breaks traceability.
- `any` or broad `Record<string, any>` where generated API types exist.

Prefer top-level `function` declarations for components. Use arrow functions for callbacks and local lambdas.

## Effects

Flag effects that:

- Transform props/state for rendering.
- Copy one state value into another representing the same concept.
- Handle user actions that belong in event handlers.
- Reset state from props when a keyed reset, stable ID, or render-time derivation would work.
- Fetch data that belongs in TanStack Query.

If an effect remains, it must synchronize with a named external system: browser API, subscription, timer, analytics-on-visibility, or imperative DOM integration.

## State Modeling

Flag:

- Storing derived booleans, disabled flags, or loading labels calculable from current query state.
- Local state used to fake server data.
- UI state persisted to `localStorage` when it is live app state.
- Feature-local mock data wired to unrelated existing APIs before the real API is confirmed.

Prefer render-time derivation. Keep true local state for user choices, transient input, controlled popups, and feature UI state that has no server source.

## Navigation

Flag:

- Imperative router navigation for ordinary links.
- Button semantics used for navigation.
- Navigation state hidden in component state when TanStack Router search params are required for shareable filters, tabs, or pagination.
- `window.location` or raw `history` calls instead of TanStack Router APIs.

Use TanStack Router `Link` for normal navigation. Use router `navigate` for mutation success, guarded redirects, or form submission side effects.
