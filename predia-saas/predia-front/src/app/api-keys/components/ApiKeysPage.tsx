import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createColumnHelper } from '@tanstack/react-table'
import { Plus, Ban, Copy, Check, KeyRound, Globe, Server, AlertTriangle } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Textarea } from '@/design-system/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/ui/dialog'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import { DataTable } from '@/shared/components/data-table'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { notify } from '@/shared/lib/notifications'
import { cn } from '@/shared/lib/utils'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../hooks'
import {
  createApiKeySchema,
  parseOrigin,
  splitOrigins,
  type CreateApiKeyFormValues,
} from '../types/create-api-key.schema'
import type { ApiKey, CreatedApiKey } from '../types'

type Scope = 'tenant' | 'portal'

const COPY: Record<Scope, { title: string; subtitle: string; origin: string }> = {
  tenant: {
    title: 'API keys',
    subtitle:
      'Conectá el sitio web de tu inmobiliaria con Predia: tus propiedades publicadas y un formulario que crea leads en el CRM.',
    origin: 'https://www.tuinmobiliaria.com',
  },
  portal: {
    title: 'API keys del portal',
    subtitle:
      'Keys de la web de Predia (predia-website). Leen las propiedades publicadas de todas las inmobiliarias con suscripción vigente.',
    origin: 'https://www.predia.cr',
  },
}

type KeyStatus = 'active' | 'expired' | 'revoked'

function keyStatus(key: ApiKey): KeyStatus {
  if (key.revoked_at) return 'revoked'
  if (key.expires_at && new Date(key.expires_at) <= new Date()) return 'expired'
  return 'active'
}

const STATUS_LABEL: Record<KeyStatus, string> = {
  active: 'Activa',
  expired: 'Expirada',
  revoked: 'Revocada',
}

const STATUS_VARIANT: Record<KeyStatus, 'emerald' | 'orange' | 'default'> = {
  active: 'emerald',
  expired: 'orange',
  revoked: 'default',
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('es-CR') : '—'

// --- Columnas ---

const colHelper = createColumnHelper<ApiKey>()

function createColumns(onRevoke: (key: ApiKey) => void) {
  return [
    colHelper.accessor('name', {
      header: 'Nombre',
      cell: (info) => (
        <span className={cn('font-medium whitespace-nowrap', keyStatus(info.row.original) !== 'active' && 'opacity-50')}>
          {info.getValue()}
        </span>
      ),
    }),
    colHelper.accessor('type', {
      header: 'Tipo',
      cell: (info) =>
        info.getValue() === 'publishable' ? (
          <Badge variant="violet">Publishable</Badge>
        ) : (
          <Badge variant="pink">Secret</Badge>
        ),
    }),
    colHelper.accessor('key_prefix', {
      header: 'Key',
      cell: (info) => (
        <code className="font-mono text-[13px] text-muted-foreground whitespace-nowrap">{info.getValue()}…</code>
      ),
    }),
    colHelper.accessor('allowed_origins', {
      header: 'Orígenes',
      cell: (info) => {
        const origins = info.getValue()
        if (info.row.original.type === 'secret') {
          return <span className="text-muted-foreground">Solo servidor</span>
        }
        return (
          <ul className="space-y-0.5 text-[13px]">
            {origins.map((o) => (
              <li key={o} className="font-mono">{o}</li>
            ))}
          </ul>
        )
      },
    }),
    colHelper.accessor('last_used_at', {
      header: 'Usada',
      cell: (info) => (info.getValue() ? formatDate(info.getValue()) : 'Nunca'),
      meta: { className: 'text-muted-foreground' },
    }),
    colHelper.display({
      id: 'status',
      header: 'Estado',
      cell: (info) => {
        const key = info.row.original
        const status = keyStatus(key)
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
            {status === 'active' && key.expires_at && (
              <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                Vence {formatDate(key.expires_at)}
              </span>
            )}
          </div>
        )
      },
    }),
    colHelper.display({
      id: 'actions',
      header: () => null,
      cell: (info) => {
        const key = info.row.original
        if (key.revoked_at) return null
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive gap-1.5"
            onClick={() => onRevoke(key)}
            aria-label={`Revocar la key ${key.name}`}
          >
            <Ban className="size-4" />
            Revocar
          </Button>
        )
      },
    }),
  ]
}

// --- Alta ---

interface CreateApiKeySheetProps {
  open: boolean
  scope: Scope
  onOpenChange: (open: boolean) => void
  onCreated: (key: CreatedApiKey) => void
}

function CreateApiKeySheet({ open, scope, onOpenChange, onCreated }: CreateApiKeySheetProps) {
  const { mutate: createKey, isPending } = useCreateApiKey()

  const form = useForm({
    defaultValues: {
      name: '',
      type: 'publishable',
      allowed_origins: '',
      expires_at: '',
    } as CreateApiKeyFormValues,
    validators: { onSubmit: createApiKeySchema },
    onSubmit: ({ value }) => {
      const isPublishable = value.type === 'publishable'
      createKey(
        {
          name: value.name.trim(),
          type: value.type,
          ...(isPublishable && {
            allowed_origins: splitOrigins(value.allowed_origins).map(
              (o) => parseOrigin(o) ?? o,
            ),
          }),
          ...(value.expires_at && {
            expires_at: new Date(`${value.expires_at}T23:59:59`).toISOString(),
          }),
        },
        {
          onSuccess: (created) => {
            form.reset()
            onCreated(created)
          },
        },
      )
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  // Lazy init: Date.now() fuera del render (regla de pureza del React Compiler).
  const [tomorrow] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10))

  return (
    <FormSheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) form.reset()
      }}
      title="Nueva API key"
      description="La key completa se muestra una sola vez al crearla."
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      submitLabel="Crear key"
    >
      <form.Field name="name">
        {(field) => (
          <FormField field={field} label="Nombre" hint="Para reconocerla, ej. «Sitio web principal».">
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              maxLength={80}
              autoComplete="off"
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="type">
        {(field) => (
          <FormField
            field={field}
            label="Tipo"
            hint={
              field.state.value === 'publishable'
                ? 'Para el navegador: solo lectura + formulario de contacto, y solo desde los orígenes que indiques.'
                : 'Para tu servidor (build o SSR). Nunca la pongas en código que llega al navegador.'
            }
          >
            <Select
              value={field.state.value}
              onValueChange={(v: 'publishable' | 'secret') => field.handleChange(v)}
              onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publishable">Publishable (pk_) · navegador</SelectItem>
                <SelectItem value="secret">Secret (sk_) · solo servidor</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.type}>
        {(type) =>
          type === 'publishable' && (
            <form.Field name="allowed_origins">
              {(field) => (
                <FormField
                  field={field}
                  label="Orígenes permitidos"
                  hint={`Uno por línea, exacto y con https. Ej. ${COPY[scope].origin}. Para desarrollo podés usar http://localhost:4321.`}
                >
                  <Textarea
                    id="allowed_origins"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    rows={3}
                    spellCheck={false}
                    autoComplete="off"
                    className="font-mono text-[13px]"
                  />
                </FormField>
              )}
            </form.Field>
          )
        }
      </form.Subscribe>

      <form.Field name="expires_at">
        {(field) => (
          <FormField field={field} label="Vence el" optional hint="Sin fecha, la key vale hasta que la revoques.">
            <Input
              id="expires_at"
              type="date"
              min={tomorrow}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </FormField>
        )}
      </form.Field>
    </FormSheet>
  )
}

// --- Key recién creada (una sola vez) ---

function envVarFor(key: CreatedApiKey): string {
  if (key.type === 'secret') return 'PREDIA_API_SECRET_KEY'
  return 'PUBLIC_PREDIA_PUBLISHABLE_KEY'
}

interface RevealKeyDialogProps {
  apiKey: CreatedApiKey | null
  open: boolean
  onClose: () => void
  onClosed: () => void
}

function RevealKeyDialog({ apiKey, open, onClose, onClosed }: RevealKeyDialogProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!apiKey) return
    try {
      await navigator.clipboard.writeText(apiKey.plaintext_key)
      setCopied(true)
      notify.success({ title: 'Key copiada al portapapeles' })
    } catch {
      notify.error({ title: 'No se pudo copiar', description: 'Seleccioná el texto y copialo a mano.' })
    }
  }

  const isSecret = apiKey?.type === 'secret'

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setCopied(false)
          onClose()
        }
      }}
    >
      {/* Un clic afuera no la cierra: la key no se puede volver a ver. */}
      <DialogContent
        className="max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        // Tras la animación de cierre: soltar la key en texto plano del estado.
        onCloseAutoFocus={onClosed}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            Guardá tu nueva key
          </DialogTitle>
          <DialogDescription>
            Es la única vez que se muestra completa: Predia solo guarda un hash. Si la perdés,
            revocala y creá otra.
          </DialogDescription>
        </DialogHeader>

        {apiKey && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="plaintext_key" className="text-sm font-medium">
                {apiKey.name}
              </label>
              <div className="flex gap-2">
                <Input
                  id="plaintext_key"
                  readOnly
                  value={apiKey.plaintext_key}
                  onFocus={(e) => e.currentTarget.select()}
                  className="font-mono text-[13px]"
                  spellCheck={false}
                />
                <Button type="button" variant="outline" onClick={copy} className="shrink-0 gap-1.5">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Copiada' : 'Copiar'}
                </Button>
              </div>
            </div>

            <div
              className={cn(
                'flex gap-2.5 rounded-md border p-3 text-[13px] leading-5',
                isSecret ? 'border-destructive/30 bg-destructive/5' : 'border-hairline bg-surface-soft',
              )}
            >
              {isSecret ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              ) : (
                <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <p>
                {isSecret ? (
                  <>
                    Usala solo en el servidor, como variable de entorno{' '}
                    <code className="font-mono">{envVarFor(apiKey)}</code>. No la subas al repositorio
                    ni le pongas el prefijo <code className="font-mono">PUBLIC_</code>: el API rechaza
                    una key secreta si llega desde un navegador.
                  </>
                ) : (
                  <>
                    Puede ir en el código del navegador (
                    <code className="font-mono">{envVarFor(apiKey)}</code>): solo funciona desde{' '}
                    {apiKey.allowed_origins.join(', ')} y solo lee datos públicos o envía el
                    formulario de contacto.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={() => {
              setCopied(false)
              onClose()
            }}
          >
            Ya la guardé
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Página ---

function ApiKeysPage({ scope }: { scope: Scope }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [created, setCreated] = useState<CreatedApiKey | null>(null)
  const [revealOpen, setRevealOpen] = useState(false)
  const [toRevoke, setToRevoke] = useState<ApiKey | null>(null)

  const { data, isLoading, error } = useApiKeys()
  const { mutate: revokeKey, isPending: isRevoking } = useRevokeApiKey()

  const columns = createColumns(setToRevoke)
  const keys: ApiKey[] = data ?? []
  const copy = COPY[scope]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">{copy.title}</Heading>
          <Text as="sm" className="text-muted-foreground mt-1 max-w-2xl">
            {copy.subtitle}
          </Text>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nueva key
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section aria-labelledby="pk-title" className="rounded-lg border border-hairline p-4">
          <h2 id="pk-title" className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="size-4" /> Publishable · pk_
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
            Para el navegador. Solo responde a los orígenes registrados, solo lee propiedades
            publicadas y recibe leads del formulario de contacto (con límite de envíos).
          </p>
        </section>
        <section aria-labelledby="sk-title" className="rounded-lg border border-hairline p-4">
          <h2 id="sk-title" className="flex items-center gap-2 text-sm font-semibold">
            <Server className="size-4" /> Secret · sk_
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
            Para el servidor que genera el sitio (build o SSR). Se rechaza si llega desde un
            navegador. Guardala como variable de entorno, nunca en el repositorio.
          </p>
        </section>
      </div>

      <DataTable
        columns={columns}
        data={keys}
        isLoading={isLoading}
        error={!!error}
        emptyMessage="Todavía no hay API keys."
        getRowId={(row) => row.id}
      />

      <CreateApiKeySheet
        open={createOpen}
        scope={scope}
        onOpenChange={setCreateOpen}
        onCreated={(key) => {
          setCreateOpen(false)
          setCreated(key)
          setRevealOpen(true)
        }}
      />

      <RevealKeyDialog
        apiKey={created}
        open={revealOpen}
        onClose={() => setRevealOpen(false)}
        onClosed={() => setCreated(null)}
      />

      <ConfirmDialog
        open={toRevoke !== null}
        onOpenChange={(v) => { if (!v) setToRevoke(null) }}
        title="Revocar API key"
        description={
          <>
            <strong>{toRevoke?.name}</strong> ({toRevoke?.key_prefix}…) deja de funcionar al
            instante y no se puede reactivar. Los sitios que la usen dejarán de recibir datos.
          </>
        }
        confirmLabel="Revocar"
        isPending={isRevoking}
        onConfirm={() => {
          if (!toRevoke) return
          revokeKey(toRevoke.id, { onSuccess: () => setToRevoke(null) })
        }}
      />
    </div>
  )
}

export default ApiKeysPage
