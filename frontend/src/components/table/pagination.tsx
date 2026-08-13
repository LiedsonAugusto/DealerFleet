import { Icon } from '@/components/ui/icon'
import { PAGE_SIZES } from '@/hooks/use-table-params'
import { pageCount, pageNumbers } from '@/lib/table'
import { cn } from '@/lib/utils'

type PaginationProps = {
  page: number
  size: number
  total: number
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
}

const stepClasses = [
  'grid size-8 cursor-pointer place-items-center rounded-md border border-slate-300 bg-white text-slate-600',
  'transition-colors hover:bg-slate-50 hover:text-slate-900',
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white',
].join(' ')

export function Pagination({ page, size, total, onPageChange, onSizeChange }: PaginationProps) {
  const pages = pageCount(total, size)
  const current = Math.min(page, pages)
  const first = total === 0 ? 0 : (current - 1) * size + 1
  const last = Math.min(current * size, total)

  return (
    <div className="mt-4 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-600">
          {total === 0 ? (
            'Nenhum resultado'
          ) : (
            <>
              Mostrando <span className="font-medium text-slate-900">{first}</span>–
              <span className="font-medium text-slate-900">{last}</span> de{' '}
              <span className="font-medium text-slate-900">{total}</span>
            </>
          )}
        </p>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hidden sm:inline">Por página</span>
          <select
            value={size}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            className="cursor-pointer rounded-md border border-slate-300 bg-white py-1 pl-2 pr-6 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:outline-2 focus:outline-offset-0 focus:outline-brand-600"
          >
            {PAGE_SIZES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Paginação" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          aria-label="Página anterior"
          className={stepClasses}
        >
          <Icon name="chevronLeft" className="size-4" />
        </button>

        {pageNumbers(current, pages).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-sm text-slate-400">
              &hellip;
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === current ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 cursor-pointer rounded-md border px-2 text-sm font-medium transition-colors',
                item === current
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= pages}
          aria-label="Próxima página"
          className={stepClasses}
        >
          <Icon name="chevronRight" className="size-4" />
        </button>
      </nav>
    </div>
  )
}
