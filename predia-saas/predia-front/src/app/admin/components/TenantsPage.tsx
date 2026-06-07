import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Users } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { Input } from '@/design-system/ui/input'
import { Badge } from '@/design-system/ui/badge'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/design-system/ui/form-field'
import { useTenants, useCreateTenant } from '@/app/tenants/hooks'
import { createTenantSchema, type CreateTenantFormValues } from '@/app/tenants/types/create-tenant.schema'
import type { SubscriptionStatus, Tenant } from '@/app/tenants/types'

const PAGE_LIMIT = 20

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: 'Prueba',
  active: 'Activo',
  past_due: 'Vencido',
  cancelled: 'Cancelado',
}

const STATUS_VARIANT: Record<SubscriptionStatus, 'default' | 'emerald' | 'orange' | 'pink'> = {
  trial: 'default',
  active: 'emerald',
  past_due: 'orange',
  cancelled: 'pink',
}

function TenantsPage() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  const { mutate: createTenant, isPending } = useCreateTenant()
  const { data: tenantsData, isLoading: loadingTenants } = useTenants({ page, limit: PAGE_LIMIT })

  const form = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      advisor_email: '',
      advisor_password: '',
      advisor_first_name: '',
      advisor_last_name: '',
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    reset,
  } = form

  const watchedName = useWatch({ control, name: 'name' })

  useEffect(() => {
    const slug = slugify(watchedName ?? '')
    setValue('slug', slug, { shouldValidate: false })
  }, [watchedName, setValue])

  function onSubmit(data: CreateTenantFormValues) {
    createTenant(data, {
      onSuccess: () => {
        setOpen(false)
        reset()
      },
    })
  }

  const tenants: Tenant[] = tenantsData?.data ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">Organizaciones</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">
            Gestiona los tenants de la plataforma.
          </Text>
        </div>
        <Button onClick={() => setOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nueva organización
        </Button>
      </div>

      <FormSheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) reset()
        }}
        title="Nueva organización"
        description="Crea un nuevo tenant y su asesor principal."
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isPending}
        submitLabel="Crear organización"
      >
        <FormField label="Nombre de la inmobiliaria" htmlFor="name" error={errors.name?.message}>
          <Input id="name" placeholder="Ej. Inmobiliaria Norte" {...register('name')} autoComplete="off" />
        </FormField>

        <FormField
          label="Identificador único"
          htmlFor="slug"
          error={errors.slug?.message}
        >
          <Input
            id="slug"
            placeholder="inmobiliaria-norte"
            {...register('slug')}
            autoComplete="off"
          />
        </FormField>

        <hr className="border-hairline" />

        <Text as="sm" className="font-semibold text-foreground">
          Asesor principal
        </Text>

        <FormField label="Nombre" htmlFor="advisor_first_name" error={errors.advisor_first_name?.message}>
          <Input id="advisor_first_name" placeholder="Ej. Carlos" {...register('advisor_first_name')} autoComplete="given-name" />
        </FormField>

        <FormField label="Apellido" htmlFor="advisor_last_name" error={errors.advisor_last_name?.message}>
          <Input id="advisor_last_name" placeholder="Ej. Mendoza" {...register('advisor_last_name')} autoComplete="family-name" />
        </FormField>

        <FormField label="Correo electrónico" htmlFor="advisor_email" error={errors.advisor_email?.message}>
          <Input id="advisor_email" type="email" placeholder="asesor@inmobiliaria.com" {...register('advisor_email')} autoComplete="email" />
        </FormField>

        <FormField label="Contraseña" htmlFor="advisor_password" error={errors.advisor_password?.message}>
          <Input id="advisor_password" type="password" placeholder="Mínimo 8 caracteres" {...register('advisor_password')} autoComplete="new-password" />
        </FormField>
      </FormSheet>

      {/* Tenants list */}
      <div className="bg-canvas rounded-2xl border border-hairline shadow-raised overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <Text as="md" className="font-semibold">
            Tenants registrados
            {tenantsData && (
              <span className="ml-2 text-muted-foreground font-normal text-sm">
                ({tenantsData.meta?.total ?? tenants.length})
              </span>
            )}
          </Text>
        </div>

        {loadingTenants ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <Text as="sm" className="text-muted-foreground">No hay organizaciones registradas aún.</Text>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4 mr-1" /> Crear primera organización
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/40">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Slug</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Creado</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant, i) => (
                  <tr key={tenant.id} className={i !== tenants.length - 1 ? 'border-b border-hairline' : ''}>
                    <td className="px-6 py-4 font-medium">{tenant.name}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground text-xs">{tenant.slug}</td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANT[tenant.subscription_status]}>
                        {STATUS_LABEL[tenant.subscription_status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString('es-CR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to="/admin/tenants/$id"
                        params={{ id: tenant.id }}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Users className="size-3.5" />
                        Usuarios
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tenantsData?.meta && (
          <PaginationControls
            page={page}
            pageCount={tenantsData.meta.totalPages}
            itemCount={tenantsData.meta.total}
            limit={PAGE_LIMIT}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}

export default TenantsPage
