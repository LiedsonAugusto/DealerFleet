import type { ReactNode } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Toast, ToastTone } from '@/components/toast/toast-context'
import { ToastContext } from '@/components/toast/toast-context'
import type { IconName } from '@/components/ui/icon'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

const DURATION = 5000
const MAX_VISIBLE = 3

const STYLES: Record<ToastTone, { icon: IconName; accent: string; badge: string; title: string }> = {
  success: {
    icon: 'checkCircle',
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    title: 'Operação concluída',
  },
  error: {
    icon: 'alertCircle',
    accent: 'bg-red-500',
    badge: 'bg-red-50 text-red-600 ring-red-100',
    title: 'Não foi possível concluir',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = nextId.current++
    setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { ...toast, id }])
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:left-auto sm:right-6 sm:w-[26rem]"
      >
        {toasts.map((toast) => {
          const style = STYLES[toast.tone]

          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className="group animate-toast-in pointer-events-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10"
            >
              <div className="flex items-start gap-3 p-4">
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full ring-1',
                    style.badge,
                  )}
                >
                  <Icon name={style.icon} className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {style.title}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">{toast.message}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-sm text-slate-500">{toast.description}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Fechar notificação"
                  className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <Icon name="x" className="size-3.5" />
                </button>
              </div>

              <div className="h-1 w-full bg-slate-100">
                <div
                  onAnimationEnd={() => dismiss(toast.id)}
                  style={{ animationDuration: `${DURATION}ms` }}
                  className={cn(
                    'animate-toast-progress h-full origin-left',
                    'group-hover:[animation-play-state:paused]',
                    style.accent,
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
