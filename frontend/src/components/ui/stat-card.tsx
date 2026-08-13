import type { IconName } from '@/components/ui/icon'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

type Tone = 'brand' | 'emerald' | 'amber' | 'slate'

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

type StatCardProps = {
  label: string
  value: string
  hint?: string
  icon: IconName
  tone?: Tone
  loading?: boolean
}

export function StatCard({ label, value, hint, icon, tone = 'brand', loading }: StatCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg ring-1', TONES[tone])}>
        <Icon name={icon} className="size-5" />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-7 w-20 animate-pulse rounded bg-slate-200" />
        ) : (
          <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        )}
        {hint && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}
