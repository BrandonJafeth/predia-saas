'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/shared/lib/utils'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

interface PopoverContentProps extends React.ComponentProps<typeof PopoverPrimitive.Content> {
  // Radix Dialog traps focus within its own DOM subtree. A Popover portaled
  // to document.body (the default) is a DOM *sibling* of an ancestor Dialog,
  // not a descendant, so the Dialog's focus trap fights it and yanks focus
  // straight back out. Pass the Dialog/Sheet content node here (e.g. via
  // `el.closest('[role="dialog"]')`) to portal inside it instead.
  container?: HTMLElement | null
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  container,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          // Radix's popper positioning wrapper sets pointer-events:none on
          // itself (so oversized animation bounds don't block clicks behind
          // it) — the actual content must opt back in or nothing inside is
          // clickable.
          'pointer-events-auto bg-canvas text-ink z-50 w-auto rounded-xl border border-hairline p-0 shadow-raised',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
