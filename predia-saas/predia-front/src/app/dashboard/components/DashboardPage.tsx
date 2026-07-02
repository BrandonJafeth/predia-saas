import { Link } from '@tanstack/react-router'
import { Building2, Users, BarChart3, UsersRound, ChevronRight } from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Heading, Text } from '@/design-system/typography'
import { useProperties } from '@/app/properties/hooks'
import { useUsers } from '@/app/users/hooks'
import { useCurrentUser } from '@/app/auth/hooks'
import { tokenStorage } from '@/shared/lib/tokens'
import type { Property } from '@/app/properties/types'

const CHART_COLORS = {
  active:   '#1C2028',
  draft:    '#9CA3AF',
  inactive: '#D6DCE5',
  sold:     '#343A40',
  rented:   '#6B7280',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa', draft: 'Borrador',
  inactive: 'Inactiva', sold: 'Vendida', rented: 'Arrendada',
}

const OP_LABEL: Record<string, string> = {
  sale: 'Venta', rent: 'Arriendo', lease: 'Alquiler',
}

// ── Module card ───────────────────────────────────────────────────────────────
function ModuleCard({
  title, subtitle, url, icon: Icon, count,
}: {
  title: string
  subtitle: string
  url: string
  icon: React.ElementType
  count: number | null
}) {
  return (
    <Link
      to={url}
      className="group flex flex-col justify-between rounded-xl border border-hairline bg-canvas p-5 shadow-soft transition-all duration-200 hover:border-surface-strong hover:shadow-raised min-w-0"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-soft">
            <Icon className="h-4 w-4 text-ink-body" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{title}</p>
            <p className="text-caption text-ink-muted truncate">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft transition-transform duration-200 group-hover:translate-x-0.5 mt-0.5" />
      </div>

      {/* Count */}
      <p className="text-2xl font-semibold leading-none tracking-tight text-ink">
        {count !== null ? count : '—'}
      </p>
    </Link>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-hairline bg-canvas px-3 py-2 shadow-raised text-sm">
      <p className="font-medium text-ink">{payload[0].name}</p>
      <p className="text-ink-muted">{payload[0].value} propiedades</p>
    </div>
  )
}

// ── Greeting ──────────────────────────────────────────────────────────────────
function Greeting({ name }: { name: string }) {
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  return <>{name ? `${saludo}, ${name}` : 'Dashboard'}</>
}

// ── Page ──────────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { data: currentUser } = useCurrentUser()
  const role = tokenStorage.decodeAccessToken()?.role
  const isAdmin = role === 'admin'

  const { data: propsData } = useProperties({ limit: 100 })
  const { data: usersData } = useUsers({ limit: 1 })

  const properties: Property[] = (propsData as { data?: Property[] } | undefined)?.data ?? []
  const totalProps = (propsData as { meta?: { itemCount?: number } } | undefined)?.meta?.itemCount ?? null
  const activeProps = properties.filter(p => p.status === 'active').length || null
  const totalUsers = (usersData as { meta?: { itemCount?: number } } | undefined)?.meta?.itemCount ?? null

  // Pie data
  const byStatus = Object.entries(
    properties.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    }, {})
  ).map(([key, count]) => ({
    name: STATUS_LABEL[key] ?? key,
    value: count,
    color: CHART_COLORS[key as keyof typeof CHART_COLORS] ?? '#D6DCE5',
  }))

  // Bar data
  const byOp = Object.entries(
    properties.reduce<Record<string, number>>((acc, p) => {
      const op = (p as Property & { operation_type?: string }).operation_type ?? 'sale'
      acc[op] = (acc[op] ?? 0) + 1
      return acc
    }, {})
  ).map(([key, count]) => ({ name: OP_LABEL[key] ?? key, value: count }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <Heading as="lg"><Greeting name={currentUser?.first_name ?? ''} /></Heading>
        <Text as="sm" className="text-ink-muted mt-1">Resumen de tu actividad</Text>
      </div>

      {/* Module cards — horizontal scroll on mobile */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ModuleCard title="Propiedades" subtitle="Gestiona tu inventario" url="/properties" icon={Building2} count={totalProps} />
        <ModuleCard title="Leads" subtitle="Clientes potenciales" url="/leads" icon={Users} count={null} />
        <ModuleCard title="Reportes" subtitle="Métricas y analítica" url="/reports" icon={BarChart3} count={null} />
        {isAdmin && (
          <ModuleCard title="Usuarios" subtitle="Miembros del equipo" url="/users" icon={UsersRound} count={totalUsers} />
        )}
      </div>

      {/* Charts */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

          {/* Bar — ocupa 3 columnas */}
          <div className="lg:col-span-3 rounded-xl border border-hairline bg-canvas p-6 shadow-soft">
            <p className="text-sm font-semibold text-ink">Propiedades por tipo de operación</p>
            <p className="mt-0.5 mb-6 text-caption text-ink-muted">Distribución entre venta, arriendo y alquiler</p>
            {byOp.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byOp} barSize={36} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#ECEEF1" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F7F7F8', radius: 6 }} />
                  <Bar dataKey="value" fill="#1C2028" radius={[5, 5, 0, 0]} name="Propiedades" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[180px] items-center justify-center">
                <p className="text-caption text-ink-soft">Sin datos suficientes</p>
              </div>
            )}
          </div>

          {/* Donut — ocupa 2 columnas */}
          <div className="lg:col-span-2 rounded-xl border border-hairline bg-canvas p-6 shadow-soft">
            <p className="text-sm font-semibold text-ink">Estado del inventario</p>
            <p className="mt-0.5 mb-4 text-caption text-ink-muted">Distribución por estado actual</p>
            {byStatus.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={byStatus} cx="50%" cy="50%" innerRadius={44} outerRadius={66} strokeWidth={0} dataKey="value">
                      {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-1.5">
                  {byStatus.map(item => (
                    <div key={item.name} className="flex items-center gap-2 text-caption">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-ink-body flex-1">{item.name}</span>
                      <span className="font-medium text-ink">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center">
                <p className="text-caption text-ink-soft">Sin datos suficientes</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}

export default DashboardPage
