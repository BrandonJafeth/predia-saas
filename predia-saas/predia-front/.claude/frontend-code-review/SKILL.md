---
name: frontend-code-review
description: Review predia-front code for correctness, accessibility, component design, shadcn-ui/Radix usage, TanStack Query contracts, performance, and design system consistency. Trigger for `.tsx`, `.ts`, UI, React, TanStack Router, pending-change, or focused frontend review requests.
---

# Frontend Code Review

## When To Use

Use this skill when the user asks to review, audit, analyze, or sanity-check frontend code under `predia-front/src/`.

Supported modes:

- **Pending-change review**: inspect staged and working-tree changes.
- **File-focused review**: inspect explicitly named files or paths.
- **Diff/snippet review**: review pasted diffs or snippets using best-effort references.

## Project Context

Stack: React 19, TypeScript, Vite, TanStack Router (file-based), TanStack React Query 5, Tailwind CSS 4, shadcn-ui / Radix UI, React Compiler enabled.

Key paths:
- `src/app/[feature]/` — feature modules (components/, hooks/, services/, types/)
- `src/design-system/` — shadcn-ui + Radix primitives, typography (Display/Heading/Text)
- `src/routes/` — TanStack Router file-based routes (never edit `routeTree.gen.ts`)
- `src/shared/lib/` — api.ts, query.ts, tokens.ts, utils.ts
- `src/layouts/` — AppLayout, AppNavbar, AppSidebar
- API client: `@predia/api-types` via `createApiClient(import.meta.env.VITE_API_URL)`
- Class merging: `cn()` from `src/shared/lib/utils.ts`

## Required Context

Before reviewing, read relevant local files:
- `CLAUDE.md` for project conventions, commands, and architecture patterns.
- Feature module files adjacent to the code under review.
- `src/shared/lib/query.ts` when reviewing TanStack Query usage.
- `src/shared/lib/tokens.ts` when reviewing auth token handling.

For UI or accessibility findings, check current Web Interface Guidelines as a baseline:

```text
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

## Rule Packs

Apply every relevant rule pack:

- [references/accessibility-ui.md](references/accessibility-ui.md) — accessibility, semantic HTML, focus, forms, keyboard, disabled states, and long-content behavior.
- [references/predia-ui.md](references/predia-ui.md) — shadcn-ui / Radix primitive usage, design system tokens, overlay and form rules.
- [references/component-architecture.md](references/component-architecture.md) — component ownership, props, state, effects, exports, and feature organization.
- [references/data-query-contracts.md](references/data-query-contracts.md) — API client contracts, TanStack Query, mutations, auth boundaries, URL state.
- [references/performance.md](references/performance.md) — React performance review rules scoped to real risk.
- [references/code-quality.md](references/code-quality.md) — TypeScript, styling, naming, and maintainability rules.
- [references/predia-invariants.md](references/predia-invariants.md) — stable predia-specific runtime invariants.

## Review Process

1. Identify review scope. For pending changes, inspect `git diff --stat` and `git diff`. For file-focused reviews, stay within named files unless referenced contracts must be read.
2. Read code around changed lines and the owning module. Do not review isolated snippets when nearby ownership, query inputs, or auth state decides correctness.
3. Check user-visible regressions first: accessibility, broken interaction, auth/permission leaks, query errors, data loss, navigation mistakes, and impossible states.
4. Then check maintainability and performance: ownership, effects, wrappers, memoization, bundle risks, and design-system drift.
5. Report only actionable findings. Omit speculative risks, style preferences, and broad refactors unless directly tied to a reproducible issue in scope.

## Severity

- **P0**: security/auth leak, data loss, production crash, inaccessible critical flow, or broken primary workflow.
- **P1**: user-visible regression, invalid API/query contract, broken keyboard/focus behavior, or serious design-system/a11y violation.
- **P2**: maintainability or performance issue likely to cause bugs, duplicated state, incorrect ownership, or non-critical a11y issue.
- **P3**: minor cleanup with clear value. Omit unless user asked for thorough audit.

## Output Format

Lead with findings, ordered by severity:

```markdown
## Findings

- [P1] Short issue title
  File: `path/to/file.tsx:123`
  Why it matters and how to reproduce or reason about it.
  Suggested fix: concrete fix direction.

## Open Questions

- Question or assumption, if any.

## Summary

Brief secondary context. Mention tests not run or residual risk.
```

Rules:
- If no findings, say `No issues found.` and mention test gaps or residual risk.
- Always include file and line when available.
- Keep findings concrete and reproducible.
- Do not include praise sections by default.
- Do not ask to apply fixes unless user explicitly wants review plus implementation.
