import { Link } from '@tanstack/react-router'
import { ShieldCheck, UsersRound, Tags, ClipboardList, ArrowRight } from 'lucide-react'
import { Heading, Text } from '@/design-system/typography'
import { useCurrentUser } from '@/app/auth/hooks'
import { useTenants } from '@/app/tenants/hooks'
import { useAllUsers } from '@/app/admin/hooks'

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
  const { data: tenantsData } = useTenants({ limit: 1 })
  const { data: usersData } = useAllUsers({ limit: 1 })

  const tenantCount = (tenantsData as { meta?: { itemCount?: number } } | undefined)?.meta?.itemCount ?? null
  const userCount = (usersData as { meta?: { itemCount?: number } } | undefined)?.meta?.itemCount ?? null

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
    </div>
  )
}

export default AdminDashboardPage
