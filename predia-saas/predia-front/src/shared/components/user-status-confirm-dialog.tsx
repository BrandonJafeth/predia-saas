import { useEffect } from 'react'
import { AlertTriangle, CircleCheck, Loader2 } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/ui/dialog'

interface UserStatusConfirmDialogProps {
  open: boolean
  action: 'suspend' | 'activate'
  userName: string
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function UserStatusConfirmDialog({
  open,
  action,
  userName,
  isPending,
  onOpenChange,
  onConfirm,
}: UserStatusConfirmDialogProps) {
  const isSuspend = action === 'suspend'
  const Icon = isSuspend ? AlertTriangle : CircleCheck

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-8 px-8 py-10 sm:px-12">
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-7 flex size-24 shrink-0 items-center justify-center rounded-full border-4 bg-canvas ${
              isSuspend ? 'border-destructive/25 text-destructive' : 'border-badge-emerald/25 text-badge-emerald-strong'
            }`}
          >
            <Icon className="size-12 stroke-[1.8]" />
          </div>

          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-3xl font-bold leading-tight text-foreground">
              {isSuspend ? 'Suspender usuario' : 'Activar usuario'}
            </DialogTitle>
            <DialogDescription className="mt-3 max-w-md text-center text-base leading-7 text-muted-foreground">
              {isSuspend
                ? `¿Está seguro de suspender a ${userName}? El usuario perderá acceso inmediatamente.`
                : `¿Está seguro de activar a ${userName}? El usuario recuperará acceso a la plataforma.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Button
            variant={isSuspend ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending}
            className="h-12 min-w-36 rounded-lg px-8 text-base"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isSuspend ? 'Suspender' : 'Activar'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-12 min-w-36 rounded-lg border-hairline bg-canvas px-8 text-base hover:bg-surface-soft"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { UserStatusConfirmDialog }
