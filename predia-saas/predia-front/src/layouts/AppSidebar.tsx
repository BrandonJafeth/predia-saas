import { Link, useRouterState } from '@tanstack/react-router'
import { useSidebar } from '@/design-system/ui/sidebar'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/design-system/ui/sidebar'
import {
  Home,
  Building2,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  UsersRound,
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
]

const tenantSecondaryItems = [
  { title: 'Configuración', url: '/settings', icon: Settings },
  { title: 'Ayuda', url: '/help', icon: HelpCircle },
]

const systemAdminItems = [
  { title: 'Organizaciones', url: '/admin/tenants', icon: ShieldCheck },
  { title: 'Usuarios', url: '/admin/users', icon: UsersRound },
]

type NavItem = { title: string; url: string; icon: React.ElementType }

function NavGroup({
  label,
  items,
  collapsed,
  activePath,
}: {
  label: string
  items: NavItem[]
  collapsed: boolean
  activePath: string
}) {
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="font-body">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              activePath === item.url || activePath.startsWith(item.url + '/')
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={collapsed ? item.title : undefined}
                  className={collapsed ? 'justify-center px-0' : ''}
                >
                  <Link to={item.url}>
                    <item.icon />
                    {!collapsed && <span>{item.title}</span>}
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
  const { state, toggleSidebar, isMobile } = useSidebar()
  const { location } = useRouterState()
  const collapsed = !isMobile && state === 'collapsed'
  const role = tokenStorage.decodeAccessToken()?.role
  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role === 'admin'

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="h-16 shrink-0 justify-center border-b border-sidebar-border px-3">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-sm font-bold text-primary-foreground font-display">P</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary">
              <span className="text-sm font-bold text-primary-foreground font-display">P</span>
            </div>
            <span className="text-sm font-display font-semibold tracking-[-0.3px]">Predia CRM</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {isSuperAdmin ? (
          <NavGroup
            label="Administración"
            items={systemAdminItems}
            collapsed={collapsed}
            activePath={location.pathname}
          />
        ) : (
          <>
            <NavGroup
              label="Principal"
              items={tenantItems}
              collapsed={collapsed}
              activePath={location.pathname}
            />
            {isAdmin && (
              <>
                <SidebarSeparator />
                <NavGroup
                  label="Equipo"
                  items={tenantTeamItems}
                  collapsed={collapsed}
                  activePath={location.pathname}
                />
              </>
            )}
            <SidebarSeparator />
            <NavGroup
              label="Sistema"
              items={tenantSecondaryItems}
              collapsed={collapsed}
              activePath={location.pathname}
            />
          </>
        )}
      </SidebarContent>

      {!isMobile && (
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors focus-ring"
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span className="text-xs font-body">Colapsar</span>
              </>
            )}
          </button>
        </SidebarFooter>
      )}
    </div>
  )
}

export default AppSidebar
