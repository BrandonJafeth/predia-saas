import { Label } from '@/design-system/ui/label'

interface FieldLike {
  name: string | number | symbol
  state: {
    meta: {
      isTouched: boolean
      errors: ReadonlyArray<unknown>
    }
  }
}

export interface FormFieldProps {
  field: FieldLike
  label: string
  required?: boolean
  optional?: boolean
  hint?: string
  children: React.ReactNode
}

function getErrorMessage(field: FieldLike): string | undefined {
  if (!field.state.meta.isTouched || field.state.meta.errors.length === 0) return undefined
  const err = field.state.meta.errors[0]
  if (!err) return undefined
  if (typeof err === 'string') return err
  if (typeof err === 'object' && 'message' in (err as object)) {
    const msg = (err as { message: unknown }).message
    if (typeof msg === 'string' && msg) return msg
  }
  return undefined
}

function FormField({ field, label, optional, hint, children }: FormFieldProps) {
  const fieldId = String(field.name)
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`
  const error = getErrorMessage(field)

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {children}
      {hint && (
        <p id={hintId} className="text-[13px] font-body leading-[1.4] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[13px] font-body font-medium leading-[1.4] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormField }
