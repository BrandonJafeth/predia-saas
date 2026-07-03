import { Link } from '@tanstack/react-router'
import { ShieldCheck, UsersRound, Tags, ClipboardList, ArrowRight } from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Heading, Text } from '@/design-system/typography'
import { useCurrentUser } from '@/app/auth/hooks'
import { useTenants } from '@/app/tenants/hooks'
import { useAllUsers } from '@/app/admin/hooks'
import type { SubscriptionStatus } from '@/app/tenants/types'

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: 'Prueba',
  active: 'Activo',
  past_due: 'Vencido',
  cancelled: 'Cancelado',
}

const STATUS_COLOR: Record<SubscriptionStatus, string> = {
  trial: '#9CA3AF',
  active: '#10B981',
  past_due: '#F97316',
  cancelled: '#EC4899',
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Superadmin',
  admin: 'Admin',
  agent: 'Agente',
}

function ChartTooltip({ active, payload, unit }: { active?: boolean; payload?: { name: string; value: number }[]; unit: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-hairline bg-canvas px-3 py-2 shadow-raised text-sm">
      <p className="font-medium text-ink">{payload[0].name}</p>
      <p className="text-ink-muted">{payload[0].value} {unit}</p>
    </div>
  )
}

type CardDef = {
  title: string
  description: string
  url: string
  icon: React.ElementType
  count: number | null
}

function ModuleCard({ title, description, url, icon: Icon, count }: CardDef) {
  return (
    <Link
      to={url}
      className="group flex flex-col gap-5 rounded-xl border border-hairline bg-canvas p-6 shadow-soft transition-all duration-200 hover:border-surface-strong hover:shadow-raised"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-soft">
          <Icon className="h-5 w-5 text-ink-body" />
        </div>
        <ArrowRight className="h-4 w-4 text-ink-soft transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>

      <div className="space-y-0.5">
        {count !== null ? (
          <p className="text-[32px] font-semibold leading-none tracking-tight text-ink">
            {count}
          </p>
        ) : (
          <p className="text-[32px] font-semibold leading-none tracking-tight text-ink-soft">
            —
          </p>
        )}
        <p className="pt-1 text-sm font-medium text-ink">{title}</p>
        <p className="text-caption text-ink-muted">{description}</p>
      </div>
    </Link>
  )
}

function Greeting({ name }: { name: string }) {
  const hour = new Date().getHours()
  const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  return <>{name ? `${saludo}, ${name}` : 'Dashboard'}</>
}

function AdminDashboardPage() {
  const { data: currentUser } = useCurrentUser()
  const { data: tenantsData } = useTenants({ limit: 100 })
  const { data: usersData } = useAllUsers({ limit: 100 })

  const tenants = (tenantsData as { data?: { subscription_status: SubscriptionStatus }[] } | undefined)?.data ?? []
  const users = (usersData as { data?: { role: string }[] } | undefined)?.data ?? []

  const tenantCount = (tenantsData as { meta?: { itemCount?: number } } | undefined)?.meta?.itemCount ?? null
  const userCount = (usersData as { meta?: { itemCount?: number } } | undefined)?.meta?.itemCount ?? null

  const byStatus = Object.entries(
    tenants.reduce<Record<string, number>>((acc, t) => {
      acc[t.subscription_status] = (acc[t.subscription_status] ?? 0) + 1
      return acc
    }, {})
  ).map(([key, count]) => ({
    name: STATUS_LABEL[key as SubscriptionStatus] ?? key,
    value: count,
    color: STATUS_COLOR[key as SubscriptionStatus] ?? '#D6DCE5',
  }))

  const byRole = Object.entries(
    users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1
      return acc
    }, {})
  ).map(([key, count]) => ({ name: ROLE_LABEL[key] ?? key, value: count }))

  const cards: CardDef[] = [
    {
      title: 'Organizaciones',
      description: 'Gestiona los tenants de la plataforma',
      url: '/admin/tenants',
      icon: ShieldCheck,
      count: tenantCount,
    },
    {
      title: 'Usuarios',
      description: 'Todos los usuarios registrados en el sistema',
      url: '/admin/users',
      icon: UsersRound,
      count: userCount,
    },
    {
      title: 'Categorías',
      description: 'Categorías de anuncios y sus atributos',
      url: '/admin/categories',
      icon: Tags,
      count: null,
    },
    {
      title: 'Audit Log',
      description: 'Registro de actividad del sistema',
      url: '/admin/audit-log',
      icon: ClipboardList,
      count: null,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <Heading as="lg">
          <Greeting name={currentUser?.first_name ?? ''} />
        </Heading>
        <Text as="sm" className="text-ink-muted mt-1">
          Panel de administración del sistema
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <ModuleCard key={card.url} {...card} />
        ))}
      </div>

      {(byRole.length > 0 || byStatus.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

          {/* Bar — usuarios por rol */}
          <div className="lg:col-span-3 rounded-xl border border-hairline bg-canvas p-6 shadow-soft">
            <p className="text-sm font-semibold text-ink">Usuarios por rol</p>
            <p className="mt-0.5 mb-6 text-caption text-ink-muted">Distribución de cuentas en toda la plataforma</p>
            {byRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byRole} barSize={36} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#ECEEF1" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip unit="usuarios" />} cursor={{ fill: '#F7F7F8', radius: 6 }} />
                  <Bar dataKey="value" fill="#1C2028" radius={[5, 5, 0, 0]} name="Usuarios" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[180px] items-center justify-center">
                <p className="text-caption text-ink-soft">Sin datos suficientes</p>
              </div>
            )}
          </div>

          {/* Donut — organizaciones por estado */}
          <div className="lg:col-span-2 rounded-xl border border-hairline bg-canvas p-6 shadow-soft">
            <p className="text-sm font-semibold text-ink">Organizaciones por estado</p>
            <p className="mt-0.5 mb-4 text-caption text-ink-muted">Estado de suscripción de cada tenant</p>
            {byStatus.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={byStatus} cx="50%" cy="50%" innerRadius={44} outerRadius={66} strokeWidth={0} dataKey="value">
                      {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip unit="organizaciones" />} />
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

export default AdminDashboardPage
