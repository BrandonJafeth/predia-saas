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
import { Home, Building2, Users, BarChart3, Settings, HelpCircle, PanelLeftClose, PanelLeft, ShieldCheck } from 'lucide-react'

const mainItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Propiedades', url: '/properties', icon: Building2 },
  { title: 'Leads', url: '/leads', icon: Users },
  { title: 'Reportes', url: '/reports', icon: BarChart3 },
]

const secondaryItems = [
  { title: 'Configuración', url: '/settings', icon: Settings },
  { title: 'Ayuda', url: '/help', icon: HelpCircle },
]

const adminItems = [
  { title: 'Organizaciones', url: '/admin/tenants', icon: ShieldCheck },
]

function AppSidebar() {
  const { state, toggleSidebar, isMobile } = useSidebar()
  const collapsed = !isMobile && state === 'collapsed'

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
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="font-body">Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={collapsed ? item.title : undefined}
                    className={collapsed ? 'justify-center px-0' : ''}
                  >
                    <a href={item.url}>
                      <item.icon />
                      {!collapsed && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="font-body">Sistema</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={collapsed ? item.title : undefined}
                    className={collapsed ? 'justify-center px-0' : ''}
                  >
                    <a href={item.url}>
                      <item.icon />
                      {!collapsed && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="font-body">Superadmin</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={collapsed ? item.title : undefined}
                    className={collapsed ? 'justify-center px-0' : ''}
                  >
                    <a href={item.url}>
                      <item.icon />
                      {!collapsed && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
