import { useSidebar } from '@/design-system/ui/sidebar'
import { Avatar, AvatarFallback } from '@/design-system/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/design-system/ui/dropdown-menu'
import { Button } from '@/design-system/ui/button'
import { Separator } from '@/design-system/ui/separator'
import { Bell, LogOut, User, PanelLeftClose, PanelLeft } from 'lucide-react'

function AppNavbar() {
  const { toggleSidebar, state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-hairline bg-canvas px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-ink"
      >
        {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-ink">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notificaciones</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2 text-muted-foreground hover:text-ink">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-surface-strong text-ink">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-body font-medium">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-body">
              <div className="flex flex-col">
                <span className="font-medium">Admin</span>
                <span className="text-xs font-normal text-muted-foreground">
                  admin@predia.com
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default AppNavbar
