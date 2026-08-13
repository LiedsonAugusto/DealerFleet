import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useTableParams } from '@/hooks/use-table-params'

function setup(search = '') {
  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[`/vehicles${search}`]}>{children}</MemoryRouter>
  }

  return renderHook(() => useTableParams({ defaultSize: 10 }), { wrapper: Wrapper })
}

describe('useTableParams', () => {
  it('usa os padroes quando a URL esta limpa', () => {
    const { result } = setup()

    expect(result.current.filters).toEqual({})
    expect(result.current.sort).toBeNull()
    expect(result.current.direction).toBe('asc')
    expect(result.current.page).toBe(1)
    expect(result.current.size).toBe(10)
    expect(result.current.activeFilters).toBe(0)
  })

  it('le filtros, ordenacao e paginacao da URL', () => {
    const { result } = setup('?brand=fiat&fuel=FLEX&sort=price&dir=desc&page=3&size=25')

    expect(result.current.filters).toEqual({ brand: 'fiat', fuel: 'FLEX' })
    expect(result.current.sort).toBe('price')
    expect(result.current.direction).toBe('desc')
    expect(result.current.page).toBe(3)
    expect(result.current.size).toBe(25)
    expect(result.current.activeFilters).toBe(2)
  })

  it('ignora tamanho de pagina fora da lista permitida', () => {
    const { result } = setup('?size=999')
    expect(result.current.size).toBe(10)
  })

  it('protege contra pagina invalida', () => {
    expect(setup('?page=0').result.current.page).toBe(1)
    expect(setup('?page=abc').result.current.page).toBe(1)
  })

  it('volta para a primeira pagina ao aplicar um filtro', () => {
    const { result } = setup('?page=4')

    act(() => result.current.setFilter('brand', 'jeep'))

    expect(result.current.filters).toEqual({ brand: 'jeep' })
    expect(result.current.page).toBe(1)
  })

  it('remove o filtro da URL quando o valor fica vazio', () => {
    const { result } = setup('?brand=jeep')

    act(() => result.current.setFilter('brand', ''))

    expect(result.current.filters).toEqual({})
    expect(result.current.activeFilters).toBe(0)
  })

  it('percorre o ciclo de ordenacao: asc, desc e nenhuma', () => {
    const { result } = setup()

    act(() => result.current.toggleSort('price'))
    expect(result.current.sort).toBe('price')
    expect(result.current.direction).toBe('asc')

    act(() => result.current.toggleSort('price'))
    expect(result.current.sort).toBe('price')
    expect(result.current.direction).toBe('desc')

    act(() => result.current.toggleSort('price'))
    expect(result.current.sort).toBeNull()
  })

  it('recomeca em ascendente ao trocar de coluna', () => {
    const { result } = setup('?sort=price&dir=desc')

    act(() => result.current.toggleSort('brand'))

    expect(result.current.sort).toBe('brand')
    expect(result.current.direction).toBe('asc')
  })

  it('troca de pagina sem perder os filtros', () => {
    const { result } = setup('?brand=fiat')

    act(() => result.current.setPage(2))

    expect(result.current.page).toBe(2)
    expect(result.current.filters).toEqual({ brand: 'fiat' })
  })

  it('limpa todos os filtros de uma vez preservando a ordenacao', () => {
    const { result } = setup('?brand=fiat&fuel=FLEX&sort=price&dir=desc')

    act(() => result.current.clearFilters())

    expect(result.current.filters).toEqual({})
    expect(result.current.sort).toBe('price')
    expect(result.current.direction).toBe('desc')
  })
})
