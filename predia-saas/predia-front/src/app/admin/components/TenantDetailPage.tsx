import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { DataTable } from '@/shared/components/data-table'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { useTenant } from '@/app/tenants/hooks'
import { useUsersByTenant } from '@/app/admin/hooks'
import type { UserWithTenant } from '@/app/admin/services/system.service'

const DEFAULT_LIMIT = 15

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

const colHelper = createColumnHelper<UserWithTenant>()

const columns = [
  colHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
    id: 'name',
    header: 'Nombre',
    meta: { className: 'font-medium' },
  }),
  colHelper.accessor('email', {
    header: 'Email',
    meta: { className: 'text-muted-foreground' },
  }),
  colHelper.accessor('role', {
    header: 'Rol',
    cell: (info) => (
      <Badge variant={ROLE_VARIANT[info.getValue()] ?? 'default'}>
        {ROLE_LABEL[info.getValue()] ?? info.getValue()}
      </Badge>
    ),
  }),
  colHelper.accessor('created_at', {
    header: 'Creado',
    cell: (info) => new Date(info.getValue()).toLocaleDateString('es-CR'),
    meta: { className: 'text-muted-foreground' },
  }),
]

function TenantDetailPage({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1)
  const limit = DEFAULT_LIMIT
  const { data: tenant, isLoading: loadingTenant } = useTenant(tenantId)
  const { data, isLoading: loadingUsers, error } = useUsersByTenant(tenantId, { page, limit })

  const users = data?.data ?? []

  return (
    <div className="space-y-6">
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

      <div className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft">
        <DataTable
          columns={columns}
          data={users}
          isLoading={loadingUsers}
          error={!!error}
          emptyMessage="Esta organización no tiene usuarios aún."
        />
      </div>

      {data?.meta && (
        <PaginationControls
          page={page}
          pageCount={data.meta.pageCount}
          itemCount={data.meta.itemCount}
          limit={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

export default TenantDetailPage
