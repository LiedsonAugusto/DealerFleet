import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

type DialogProps = {
  open: boolean
  title: string
  description?: ReactNode
  footer: ReactNode
  onClose: () => void
}

export function Dialog({ open, title, description, footer, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
    }
    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) {
          onClose()
        }
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-0 shadow-xl backdrop:backdrop-blur-[1px]"
    >
      <div className="flex flex-col gap-2 px-6 pt-6">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <div className="text-sm text-slate-600">{description}</div>}
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
        {footer}
      </div>
    </dialog>
  )
}
