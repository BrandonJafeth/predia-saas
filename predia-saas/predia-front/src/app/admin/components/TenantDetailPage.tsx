import { Link } from '@tanstack/react-router'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useTenant } from '@/app/tenants/hooks'
import { useUsersByTenant } from '@/app/admin/hooks'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Superadmin',
  admin: 'Admin',
  agent: 'Agente',
}

const ROLE_VARIANT: Record<string, 'default' | 'emerald' | 'orange'> = {
  super_admin: 'default',
  admin: 'emerald',
  agent: 'orange',
}

function TenantDetailPage({ tenantId }: { tenantId: string }) {
  const { data: tenant, isLoading: loadingTenant } = useTenant(tenantId)
  const { data, isLoading: loadingUsers, error } = useUsersByTenant(tenantId, { limit: 50 })

  const users = data?.data ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <Link
          to="/admin/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Volver a organizaciones
        </Link>

        <div className="flex flex-col gap-1">
          {loadingTenant ? (
            <div className="h-8 w-48 animate-pulse rounded bg-surface-strong/40" />
          ) : (
            <>
              <Heading as="lg">{tenant?.name ?? 'Organización'}</Heading>
              <Text as="sm" className="text-muted-foreground font-mono">{tenant?.slug}</Text>
            </>
          )}
        </div>
      </div>

      <div className="bg-canvas rounded-2xl border border-hairline shadow-raised overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <Text as="md" className="font-semibold">
            Usuarios
            {data && (
              <span className="ml-2 text-muted-foreground font-normal text-sm">
                ({data.meta?.itemCount ?? users.length})
              </span>
            )}
          </Text>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <Text as="sm" className="text-destructive">Error al cargar los usuarios.</Text>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Text as="sm" className="text-muted-foreground">Esta organización no tiene usuarios aún.</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/40">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Rol</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Creado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id} className={i !== users.length - 1 ? 'border-b border-hairline' : ''}>
                    <td className="px-6 py-4 font-medium">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={ROLE_VARIANT[user.role] ?? 'default'}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('es-CR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TenantDetailPage
