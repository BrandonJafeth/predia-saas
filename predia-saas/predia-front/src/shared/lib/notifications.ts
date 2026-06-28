import { sileo, Toaster } from 'sileo'
import type { SileoOptions, SileoPosition } from 'sileo'

export { Toaster }

export type NotifyOptions = Omit<SileoOptions, 'type'>

type PromiseOptions<T = unknown> = {
  loading: NotifyOptions
  success: NotifyOptions | ((data: T) => NotifyOptions)
  error: NotifyOptions | ((err: unknown) => NotifyOptions)
  action?: NotifyOptions | ((data: T) => NotifyOptions)
  position?: SileoPosition
}

/** Global defaults applied to every toast via <Toaster options={TOASTER_OPTIONS} /> */
export const TOASTER_OPTIONS: Partial<SileoOptions> = {
  fill: '#ffffff',
  roundness: 16,
  styles: {
    title: 'font-poppins font-semibold text-foreground',
    description: 'font-martel text-muted-foreground',
    button: 'font-poppins font-medium',
  },
}

/** Extract a human-readable message from an unknown API error.
 *  API envelope: { data, meta, error } — backend puts message in `error` field. */
export function extractApiError(err: unknown): string {
  if (err == null) return 'Ocurrió un error inesperado'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  if (typeof err === 'object') {
    const o = err as Record<string, unknown>
    if (Array.isArray(o.message)) return (o.message as string[]).join('. ')
    if (typeof o.message === 'string') return o.message
    if (typeof o.error === 'string') return o.error
    if (typeof o.error === 'object' && o.error !== null) {
      const nested = o.error as Record<string, unknown>
      if (typeof nested.message === 'string') return nested.message
    }
  }
  return 'Ocurrió un error inesperado'
}

export const notify = {
  success: (opts: NotifyOptions) => sileo.success(opts),
  error: (opts: NotifyOptions) => sileo.error(opts),
  warning: (opts: NotifyOptions) => sileo.warning(opts),
  info: (opts: NotifyOptions) => sileo.info(opts),
  action: (opts: NotifyOptions) => sileo.action(opts),

  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    opts: PromiseOptions<T>,
  ) => sileo.promise(promise, opts as Parameters<typeof sileo.promise<T>>[1]),

  dismiss: (id: string) => sileo.dismiss(id),
  clear: (position?: SileoPosition) => sileo.clear(position),
}
