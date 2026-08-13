export type CellValue = string | number | null

export type SortDirection = 'asc' | 'desc'

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function matchesText(cell: CellValue, filter: string): boolean {
  if (filter.trim() === '') {
    return true
  }
  if (cell === null) {
    return false
  }
  return normalizeText(String(cell)).includes(normalizeText(filter))
}

export function matchesExact(cell: CellValue, filter: string): boolean {
  if (filter === '') {
    return true
  }
  return String(cell ?? '') === filter
}

function compare(a: CellValue, b: CellValue): number {
  if (a === null && b === null) {
    return 0
  }
  if (a === null) {
    return 1
  }
  if (b === null) {
    return -1
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  return String(a).localeCompare(String(b), 'pt-BR', { numeric: true })
}

export function sortRows<T>(
  rows: T[],
  accessor: ((row: T) => CellValue) | undefined,
  direction: SortDirection,
): T[] {
  if (!accessor) {
    return rows
  }

  const factor = direction === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => compare(accessor(a), accessor(b)) * factor)
}

export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size))
}

export function pageSlice<T>(rows: T[], page: number, size: number): T[] {
  const start = (page - 1) * size
  return rows.slice(start, start + size)
}

export function pageNumbers(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const visible = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  const result: Array<number | 'gap'> = []
  let previous = 0

  for (const page of visible) {
    if (previous && page - previous > 1) {
      result.push('gap')
    }
    result.push(page)
    previous = page
  }

  return result
}
