import * as React from 'react'
import { Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/design-system/ui/sheet'
import { Button } from '@/design-system/ui/button'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'

interface FormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
}

function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
}: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col gap-0"
      >
        <SheetHeader className="shrink-0 px-6 pt-6 pb-4 pr-10">
          <SheetTitle asChild>
            <Heading as="md">{title}</Heading>
          </SheetTitle>
          {description && (
            <SheetDescription asChild>
              <Text as="sm" className="text-muted-foreground">
                {description}
              </Text>
            </SheetDescription>
          )}
        </SheetHeader>

        <form
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-500 delay-150 fill-mode-both">
            {children}
          </div>

          <div className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t border-hairline px-6 py-4 animate-in fade-in duration-500 delay-200 fill-mode-both">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export { FormSheet }
export type { FormSheetProps }
