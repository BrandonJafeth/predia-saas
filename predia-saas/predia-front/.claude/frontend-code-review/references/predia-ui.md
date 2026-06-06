# Predia UI Rules — shadcn-ui / Radix Primitives

Use these rules whenever a review touches `src/design-system/` or code consuming shadcn-ui / Radix UI primitives.

Design system paths:
- `src/design-system/ui/` — 18 shadcn-ui + Radix components (avatar, badge, button, card, dropdown-menu, input, label, navigation-menu, select, separator, sheet, sidebar, skeleton, tooltip, and others)
- `src/design-system/typography/` — Display, Heading, Text components (Inter font)
- Tailwind theme tokens in `src/index.css`
- Class merging via `cn()` from `src/shared/lib/utils.ts`

## Component Usage

Flag:

- Raw `div`/`span` used for interactive controls when a shadcn-ui primitive exists.
- Reimplementing dropdown, dialog, popover, select, or tooltip behavior instead of using the existing Radix-based primitives.
- Importing directly from `@radix-ui/*` when a local `src/design-system/ui/` wrapper already exists for that primitive.
- Multiple unrelated component behaviors composed in a single file that belongs in the design system.

Use the local `src/design-system/ui/` wrappers. Do not import raw Radix primitives in feature code.

## Typography

Flag:

- Raw `<h1>`–`<h6>` or `<p>` tags in feature components where Display/Heading/Text design system components should be used.
- Font size or weight set via raw Tailwind utilities instead of typography components when a matching variant exists.
- Typography components used with the wrong semantic heading level for page hierarchy.

Use `Display`, `Heading`, `Text` from `src/design-system/typography/` for all visible copy.

## Styling

Flag:

- `!important` modifiers or direct style overrides fighting primitive defaults instead of using component variants.
- Hardcoded color values where Tailwind theme tokens from `src/index.css` exist.
- Manual `z-index` overrides on overlay components (Sheet, Tooltip, Dropdown).
- `className` prop placed before default classes in `cn(...)`, preventing call-site overrides.
- `transition-all` — prefer specific transition properties.
- CSS modules or inline styles when Tailwind utilities cover the need.

Use `cn()` for conditional classes. Use theme tokens. Use component variants before forking with one-off classes.

## Forms

Flag:

- Form inputs without a `Label` relationship (missing `htmlFor` / `id` pairing or `aria-label`).
- Using raw `<input>` when the `Input` component from design system exists.
- Submit buttons missing `type="submit"` or non-submit buttons inside forms missing `type="button"`.
- Validation errors not associated with the invalid field via `aria-describedby`.

## Overlays — Sheet, Tooltip, Dropdown

Flag:

- Tooltip used for long, structured, or interactive content (use Sheet or Popover instead).
- Manual portal wrappers around Sheet or Dropdown primitives.
- Missing `aria-label` or accessible name on trigger buttons for overlays.
- Overlay open state managed via `useState` when the Radix primitive's own controlled/uncontrolled API handles it.

## Primitive Selection

Flag:

- `Select` used for searchable or free-form input (use Combobox pattern instead).
- `Tooltip` used when content must be reachable on touch or by screen readers (use popover or Sheet).
- `Sheet` used for purely decorative overlays that would be a Dialog semantically.

## Sidebar

Flag:

- Direct manipulation of sidebar state outside of the sidebar component's own state or context.
- Sidebar items not using `navigation-menu` primitives when navigating routes.
- Mobile sidebar skipping Sheet overlay pattern used in `AppLayout`.
