import { describe, expect, it } from 'vitest'
import {
  matchesExact,
  matchesText,
  normalizeText,
  pageCount,
  pageNumbers,
  pageSlice,
  sortRows,
} from '@/lib/table'

describe('normalizeText', () => {
  it('remove acentos e normaliza caixa', () => {
    expect(normalizeText('  Veículo Híbrido ')).toBe('veiculo hibrido')
  })
})

describe('matchesText', () => {
  it('aceita qualquer valor quando o filtro esta vazio', () => {
    expect(matchesText('Fiat', '')).toBe(true)
    expect(matchesText(null, '   ')).toBe(true)
  })

  it('compara ignorando acento e caixa', () => {
    expect(matchesText('Elétrico', 'eletrico')).toBe(true)
    expect(matchesText('São Paulo', 'sao pau')).toBe(true)
  })

  it('rejeita celula nula quando ha filtro', () => {
    expect(matchesText(null, 'fiat')).toBe(false)
  })

  it('compara numeros como texto', () => {
    expect(matchesText(2025, '202')).toBe(true)
  })
})

describe('matchesExact', () => {
  it('exige igualdade quando ha filtro', () => {
    expect(matchesExact('FLEX', 'FLEX')).toBe(true)
    expect(matchesExact('FLEX', 'DIESEL')).toBe(false)
    expect(matchesExact('FLEX', '')).toBe(true)
  })
})

describe('sortRows', () => {
  const rows = [{ n: 3 }, { n: 1 }, { n: 2 }]

  it('devolve a lista intacta sem accessor', () => {
    expect(sortRows(rows, undefined, 'asc')).toBe(rows)
  })

  it('ordena numericamente nos dois sentidos', () => {
    expect(sortRows(rows, (row) => row.n, 'asc').map((row) => row.n)).toEqual([1, 2, 3])
    expect(sortRows(rows, (row) => row.n, 'desc').map((row) => row.n)).toEqual([3, 2, 1])
  })

  it('nao muta o array original', () => {
    sortRows(rows, (row) => row.n, 'desc')
    expect(rows.map((row) => row.n)).toEqual([3, 1, 2])
  })

  it('joga nulos para o final independente da direcao', () => {
    const comNulo = [{ v: null }, { v: 'b' }, { v: 'a' }]

    expect(sortRows(comNulo, (row) => row.v, 'asc').map((row) => row.v)).toEqual(['a', 'b', null])
    expect(sortRows(comNulo, (row) => row.v, 'desc').map((row) => row.v)).toEqual(['b', 'a', null])
  })

  it('ordena texto respeitando acentuacao do portugues', () => {
    const nomes = [{ v: 'Ária' }, { v: 'Alfa' }, { v: 'Ana' }]

    expect(sortRows(nomes, (row) => row.v, 'asc').map((row) => row.v)).toEqual([
      'Alfa',
      'Ana',
      'Ária',
    ])
  })
})

describe('pageCount', () => {
  it('sempre devolve ao menos uma pagina', () => {
    expect(pageCount(0, 10)).toBe(1)
  })

  it('arredonda para cima', () => {
    expect(pageCount(16, 10)).toBe(2)
    expect(pageCount(20, 10)).toBe(2)
    expect(pageCount(21, 10)).toBe(3)
  })
})

describe('pageSlice', () => {
  const rows = Array.from({ length: 16 }, (_, index) => index + 1)

  it('recorta a primeira pagina', () => {
    expect(pageSlice(rows, 1, 10)).toHaveLength(10)
    expect(pageSlice(rows, 1, 10)[0]).toBe(1)
  })

  it('recorta a ultima pagina parcial', () => {
    expect(pageSlice(rows, 2, 10)).toEqual([11, 12, 13, 14, 15, 16])
  })

  it('devolve vazio alem do fim', () => {
    expect(pageSlice(rows, 9, 10)).toEqual([])
  })
})

describe('pageNumbers', () => {
  it('lista todas as paginas quando sao poucas', () => {
    expect(pageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('insere elipse dos dois lados no meio da lista', () => {
    expect(pageNumbers(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20])
  })

  it('nao insere elipse desnecessaria perto das bordas', () => {
    expect(pageNumbers(2, 20)).toEqual([1, 2, 3, 'gap', 20])
  })
})
