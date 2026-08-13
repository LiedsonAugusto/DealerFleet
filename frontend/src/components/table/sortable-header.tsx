import { Icon } from '@/components/ui/icon'
import type { SortDirection } from '@/lib/table'
import { cn } from '@/lib/utils'

type SortableHeaderProps = {
  label: string
  columnKey: string
  sort: string | null
  direction: SortDirection
  onSort: (key: string) => void
  align?: 'left' | 'right'
  className?: string
}

export function SortableHeader({
  label,
  columnKey,
  sort,
  direction,
  onSort,
  align = 'left',
  className,
}: SortableHeaderProps) {
  const active = sort === columnKey

  return (
    <th scope="col" className={cn('px-4 py-2.5', className)}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        aria-label={`Ordenar por ${label}`}
        className={cn(
          'group inline-flex cursor-pointer items-center gap-1 rounded text-xs font-semibold uppercase tracking-wide transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-900',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {label}
        <Icon
          name={active ? (direction === 'asc' ? 'chevronUp' : 'chevronDown') : 'selector'}
          className={cn(
            'size-3.5 transition-opacity',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
          )}
        />
      </button>
    </th>
  )
}
