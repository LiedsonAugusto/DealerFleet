import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { SortDirection } from '@/lib/table'

const RESERVED = new Set(['sort', 'dir', 'page', 'size'])

export const PAGE_SIZES = [10, 25, 50]

type Options = {
  defaultSort?: string
  defaultSize?: number
}

export function useTableParams({ defaultSort, defaultSize = 10 }: Options = {}) {
  const [searchParams, setSearchParams] = useSearchParams()

  const sort = searchParams.get('sort') ?? defaultSort ?? null
  const direction: SortDirection = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const size = PAGE_SIZES.includes(Number(searchParams.get('size')))
    ? Number(searchParams.get('size'))
    : defaultSize

  const filters = useMemo(() => {
    const result: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      if (!RESERVED.has(key) && value !== '') {
        result[key] = value
      }
    })
    return result
  }, [searchParams])

  const update = useCallback(
    (changes: Record<string, string | number | null>, resetPage = true) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)

          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') {
              next.delete(key)
            } else {
              next.set(key, String(value))
            }
          }

          if (resetPage) {
            next.delete('page')
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setFilter = useCallback(
    (key: string, value: string) => update({ [key]: value }),
    [update],
  )

  const toggleSort = useCallback(
    (key: string) => {
      if (sort !== key) {
        update({ sort: key, dir: 'asc' })
        return
      }
      if (direction === 'asc') {
        update({ sort: key, dir: 'desc' })
        return
      }
      update({ sort: null, dir: null })
    },
    [sort, direction, update],
  )

  const setPage = useCallback((value: number) => update({ page: value }, false), [update])

  const setSize = useCallback((value: number) => update({ size: value }), [update])

  const clearFilters = useCallback(() => {
    const cleared: Record<string, null> = {}
    for (const key of Object.keys(filters)) {
      cleared[key] = null
    }
    update(cleared)
  }, [filters, update])

  return {
    filters,
    sort,
    direction,
    page,
    size,
    activeFilters: Object.keys(filters).length,
    setFilter,
    toggleSort,
    setPage,
    setSize,
    clearFilters,
  }
}
