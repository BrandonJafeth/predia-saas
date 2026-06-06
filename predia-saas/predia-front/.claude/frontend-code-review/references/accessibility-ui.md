# Accessibility And UI Rules

Accessibility findings are first-class review findings. Treat broken keyboard access, missing accessible names, focus loss, and unreachable popup content as correctness bugs, not polish.

Before finalizing UI or accessibility findings, fetch the latest Web Interface Guidelines as a required baseline:

```text
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Combine it with:

- Radix UI docs and the relevant primitive implementation in `src/design-system/ui/` when code uses those primitives.
- MDN or WAI-ARIA standards when behavior, compatibility, or deprecation status matters.
- The current feature's product semantics, because an accessible primitive can still be used in an inaccessible workflow.

## Semantic HTML

Flag:

- Clickable `div` or `span` used for actions.
- Router navigation implemented with button or `onClick` when a TanStack Router `Link` / `<a>` is the real semantic element.
- Icon-only buttons without `aria-label` or `aria-labelledby`.
- Decorative icons missing `aria-hidden="true"`.
- Images without `alt`; use `alt=""` only when truly decorative.
- Heading levels that skip hierarchy in page-level content.

Prefer semantic HTML before ARIA.

## Keyboard And Focus

Flag:

- Interactive elements without visible `focus-visible` treatment.
- `outline-none` / `outline-hidden` without an equivalent focus-visible ring.
- Custom interactive elements missing keyboard handling.
- Focus trapped, lost, or sent to the wrong surface after dialog/popover/menu close.
- Focus ring applied to the wrong DOM node. Verify the actual focus target, especially with Radix controls.

Use `focus-visible` for keyboard focus. Use `focus-within` or `has-[:focus-visible]` when the visual wrapper is not the focused element.

## Forms

Flag:

- Inputs, selects, switches, checkboxes, or radios without a label relationship.
- Missing stable `name` on form fields that submit or validate.
- Incorrect input `type`, `inputMode`, `autoComplete`, or `spellCheck` for email, token, URL, number, search, or password fields.
- Labels that are not clickable.
- Submit buttons disabled before a request starts, preventing normal submit behavior.
- Non-submit buttons inside forms missing `type="button"`.
- Errors not associated with fields or not reachable by screen readers.
- `onPaste` blocking paste.
- Placeholder text used as the only label.
- Password managers accidentally triggered on non-auth fields.

Prefer visible labels. If visible surrounding text already labels the control, use a visually hidden label or a precise `aria-label`.

## Disabled, Loading, And Async States

Flag:

- Loading state without `aria-busy`, `role="status"`, or another accessible update path.
- Spinner or decorative loading icon exposed to screen readers.
- Disabled controls that hide the reason users cannot proceed.
- `aria-disabled` used without manually blocking click, Space, and Enter.
- Toasts or inline validation not announced when users need the update to continue.

Use native `disabled` when the control must not be interactive. Use `aria-disabled` only when the element must remain focusable and the code handles all blocked interactions.

## Overlays And Popup Reachability

Flag:

- Tooltip used for long, structured, interactive, or unique information.
- Tooltip content required to understand or complete a flow.
- Sheet/Dialog triggers without accessible names.
- Popup content without title/description where the primitive requires them.

Use Sheet or Popover for explanatory content, rich help, and infotips. Use Tooltip only as a short visual label for a trigger that already has an accessible name.

## Long Content And Layout

Flag:

- Text in flex/grid children without `min-w-0` when it can overflow.
- Names, labels, or user content lacking `truncate`, `line-clamp`, or `break-words`.
- Right-side icons, badges, or actions that shrink before the text area.
- Empty arrays or empty strings rendering broken layout instead of an empty state.
- Button, tab, badge, or card text that can overlap sibling controls at common viewport widths.

Typical layout chain: container has width constraints, text region uses `min-w-0 flex-1 truncate`, adornments use `shrink-0`.

## Motion, Images, And Copy

Flag:

- `transition-all`.
- Animations that do not respect `prefers-reduced-motion`.
- Layout-affecting animation where transform/opacity would work.
- Images without dimensions.
- Loading copy using `...` instead of `…`.
- Hardcoded dates, times, numbers, or currency formats instead of `Intl.*`.
