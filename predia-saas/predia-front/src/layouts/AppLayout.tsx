import type { ReactNode } from 'react'
import { SidebarProvider, useSidebar } from '@/design-system/ui/sidebar'
import { Sheet, SheetContent, SheetTitle } from '@/design-system/ui/sheet'
import AppNavbar from '@/layouts/AppNavbar'
import AppSidebar from '@/layouts/AppSidebar'
import { Skeleton } from '@/design-system/ui/skeleton'

function MobileSidebar() {
  const { openMobile, setOpenMobile } = useSidebar()
  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent side="left" className="w-72 p-0 [&>button]:hidden">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <AppSidebar />
      </SheetContent>
    </Sheet>
  )
}

function LayoutContent({ children }: { children: ReactNode }) {
  const { state, isMobile } = useSidebar()
  const sidebarWidth = state === 'expanded' ? '16rem' : '3rem'

  return (
    <div className="min-h-screen w-full">
      {/* Desktop fixed sidebar */}
      <div
        className="fixed left-0 top-0 z-30 hidden h-screen md:block"
        style={{ width: sidebarWidth }}
      >
        <div className="h-full border-r border-sidebar-border bg-sidebar">
          <AppSidebar />
        </div>
      </div>

      <MobileSidebar />

      {/* inline style only on desktop — avoids inline-style overriding max-md:ml-0 */}
      <main
        className="flex min-h-screen flex-col transition-[margin] duration-200 ease-linear"
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        <AppNavbar />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}

function AppLayoutSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="flex h-screen w-64 flex-col gap-4 border-r border-hairline bg-canvas p-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center gap-4 border-b border-hairline px-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
export { AppLayoutSkeleton }
