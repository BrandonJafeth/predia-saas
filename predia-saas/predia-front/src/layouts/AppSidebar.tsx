import { Link, useRouterState } from '@tanstack/react-router'
import { useSidebar } from '@/design-system/ui/sidebar'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/design-system/ui/sidebar'
import {
  Home,
  Building2,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ShieldCheck,
  UsersRound,
  ClipboardList,
  Tags,
  ChevronLeft,
  LayoutDashboard,
} from 'lucide-react'
import { tokenStorage } from '@/shared/lib/tokens'

const tenantItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Propiedades', url: '/properties', icon: Building2 },
  { title: 'Leads', url: '/leads', icon: Users },
  { title: 'Reportes', url: '/reports', icon: BarChart3 },
]

const tenantTeamItems = [
  { title: 'Usuarios', url: '/users', icon: UsersRound },
  { title: 'Audit Log', url: '/audit-log', icon: ClipboardList },
]

const tenantSecondaryItems = [
  { title: 'Configuración', url: '/settings', icon: Settings },
  { title: 'Ayuda', url: '/help', icon: HelpCircle },
]

const systemAdminItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Organizaciones', url: '/admin/tenants', icon: ShieldCheck },
  { title: 'Usuarios', url: '/admin/users', icon: UsersRound },
  { title: 'Categorías', url: '/admin/categories', icon: Tags },
  { title: 'Audit Log', url: '/admin/audit-log', icon: ClipboardList },
]

type NavItem = { title: string; url: string; icon: React.ElementType }

function NavGroup({
  label,
  items,
  activePath,
}: {
  label?: string
  items: NavItem[]
  activePath: string
}) {
  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="font-body text-sidebar-foreground/40 uppercase text-[10px] tracking-widest px-3">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              activePath === item.url || activePath.startsWith(item.url + '/')
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function AppSidebar() {
  const { isMobile, toggleSidebar } = useSidebar()
  const { location } = useRouterState()
  const role = tokenStorage.decodeAccessToken()?.role
  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role === 'admin'

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="h-16 shrink-0 border-b border-sidebar-border">
        <div className="flex h-full items-center gap-3 px-3">
          <img src="/isotipoClaro.png" alt="Predia" className="h-8 w-8 shrink-0 object-contain" />
          <span className="font-poppins text-[18px] font-normal leading-none tracking-[-0.02em] text-ink">Predia</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-3">
        {isSuperAdmin ? (
          <NavGroup
            items={systemAdminItems}
            activePath={location.pathname}
          />
        ) : (
          <>
            <NavGroup
              label="Principal"
              items={tenantItems}
              activePath={location.pathname}
            />
            {isAdmin && (
              <NavGroup
                label="Equipo"
                items={tenantTeamItems}
                activePath={location.pathname}
              />
            )}
            <NavGroup
              label="Sistema"
              items={tenantSecondaryItems}
              activePath={location.pathname}
            />
          </>
        )}
      </SidebarContent>

      {/* Close button */}
      <div className="shrink-0 border-t border-sidebar-border p-4">
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary shadow-raised hover:bg-primary-active transition-colors"
          aria-label="Cerrar menú"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
    </div>
  )
}

export default AppSidebar
