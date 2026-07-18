import { type ReactNode, useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import { SidebarProvider, useSidebar } from '@/design-system/ui/sidebar'
import { Sheet, SheetContent, SheetTitle } from '@/design-system/ui/sheet'
import { Skeleton } from '@/design-system/ui/skeleton'
import AppNavbar from '@/layouts/AppNavbar'
import AppSidebar from '@/layouts/AppSidebar'

const SIDEBAR_W = '16rem'

// ── Desktop: fixed sidebar that pushes content ────────────────────────────────
function DesktopSidebar() {
  const { state } = useSidebar()
  const isOpen = state === 'expanded'

  return (
    <div
      className={[
        'fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar shadow-sm md:block',
        'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <AppSidebar />
    </div>
  )
}

// ── Mobile: overlay sheet (unchanged) ────────────────────────────────────────
function MobileSidebar() {
  const { openMobile, setOpenMobile } = useSidebar()

  useEffect(() => {
    document.body.style.overflow = openMobile ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [openMobile])

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent side="left" className="w-72 p-0 [&>button]:hidden">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <AppSidebar />
      </SheetContent>
    </Sheet>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────
function LayoutContent({ children }: { children: ReactNode }) {
  const { state, isMobile } = useSidebar()
  const { pathname } = useLocation()
  const isOpen = state === 'expanded'

  return (
    // min-w-0: SidebarProvider's own wrapper is `flex` (row) for the
    // original shadcn sidebar pattern, but this app's sidebar is
    // `position: fixed` instead — this div ends up as that flex row's only
    // item regardless, and without min-w-0 a flex item refuses to shrink
    // below its content's intrinsic width. A wide descendant (e.g. the
    // leads kanban board) would otherwise force the whole page wider than
    // the viewport instead of scrolling within its own overflow-x-auto box.
    <div className="min-h-screen w-full min-w-0">
      <DesktopSidebar />
      <MobileSidebar />

      <main
        className="flex min-h-screen min-w-0 flex-col transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ marginLeft: isMobile ? 0 : isOpen ? SIDEBAR_W : 0 }}
      >
        <AppNavbar />
        {/* min-w-0: this is the actual leak point — a flex-col item (child
            of <main>) stretches to cross-axis width by default, but still
            refuses to shrink below its content's intrinsic width unless
            explicitly told to. Without it, a wide page (e.g. the leads
            kanban board) pushes this box past the viewport, which drags
            the whole document into horizontal scroll instead of staying
            contained in the page's own overflow-x-auto. */}
        <div key={pathname} className="min-w-0 flex-1 p-6 md:p-8 animate-page-enter">
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </div>
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
