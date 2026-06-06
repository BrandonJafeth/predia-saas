# Performance Rules

Review performance only where there is realistic impact. Do not request `memo`, `useMemo`, `useCallback`, or caching as style preferences.

## Async Waterfalls

Flag:

- Awaiting remote fetches before checking cheap synchronous conditions.
- Sequential awaits for independent operations.
- Nested per-item fetches running serially when each item can fetch in parallel.
- Suspense boundaries that force the whole page to wait when a lower boundary could isolate loading.

Prefer `Promise.all` for independent work and branch-local awaits for conditionally needed data.

## Bundle Size

Flag:

- Barrel imports from heavy libraries when direct imports are available.
- Heavy components loaded eagerly when hidden behind a dialog, tab, or feature activation.
- Analytics, logging, or third-party SDK code loaded before it is needed.
- Feature-local optional modules imported at top level only for rare flows.

Use direct imports and `React.lazy` / dynamic import where the user-visible path benefits from code splitting.

## Re-rendering

Flag:

- Effects or subscriptions reading broad state when a derived boolean or narrower selector is enough.
- Components defined inside other components.
- Derived rendering state stored in state/effects.
- Non-primitive default props recreated for memoized children.
- Expensive work recalculated on every render where it affects real interaction cost.
- High-frequency transient values stored in state when refs or CSS variables would avoid render loops.

Do not flag simple primitive expressions wrapped or not wrapped in `useMemo`; prefer no memo for simple work.

Require stable object/array/function identity only when:

- The child is memoized and identity affects renders.
- The value is an effect/query dependency.
- A library API requires stable references.
- Profiling shows avoidable re-rendering.

## DOM, Lists, And Rendering

Flag:

- Layout reads in render (`getBoundingClientRect`, `offset*`, `scrollTop`).
- Interleaved DOM reads/writes that can cause layout thrashing.
- Large lists rendering without virtualization, pagination, or `content-visibility`.
- Animations on expensive properties when transform/opacity would work.
- `transition-all`.
- Long-running non-critical browser work performed immediately instead of idle/deferred scheduling.

## React Compiler

This project has React Compiler enabled. Flag:

- Manual `useMemo` / `useCallback` / `React.memo` that the compiler already handles — they add noise and may conflict.
- Code patterns that opt out of compiler optimization (`'use no memo'` directive) without a documented reason.
