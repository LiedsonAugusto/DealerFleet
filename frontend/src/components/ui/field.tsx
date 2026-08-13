import type { ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

type FieldProps = {
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: (props: { id: string; invalid: boolean; describedBy: string | undefined }) => ReactNode
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const invalid = Boolean(error)
  const describedBy = error || hint ? messageId : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>

      {children({ id, invalid, describedBy })}

      {(error || hint) && (
        <p id={messageId} className={cn('text-xs', error ? 'text-red-600' : 'text-slate-500')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
