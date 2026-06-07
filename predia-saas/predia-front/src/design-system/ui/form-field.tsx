import * as React from 'react'
import { Label } from '@/design-system/ui/label'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}

function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  const errorId = `${htmlFor}-error`
  const child = React.Children.only(children) as React.ReactElement<React.HTMLAttributes<HTMLElement>>

  const enhanced = React.cloneElement(child, {
    id: htmlFor,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  })

  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {enhanced}
      {error && (
        <p id={errorId} role="alert" className="text-caption text-destructive font-body font-medium leading-[1.4]">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormField }
export type { FormFieldProps }
