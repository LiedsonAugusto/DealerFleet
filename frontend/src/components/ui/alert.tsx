import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'error' | 'warning' | 'info'

const TONES: Record<Tone, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-brand-200 bg-brand-50 text-brand-800',
}

type AlertProps = {
  tone?: Tone
  title?: string
  className?: string
  children: ReactNode
}

export function Alert({ tone = 'error', title, className, children }: AlertProps) {
  return (
    <div role="alert" className={cn('rounded-md border px-4 py-3 text-sm', TONES[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && 'mt-0.5')}>{children}</div>
    </div>
  )
}
