import { describe, expect, it } from 'vitest'
import {
  currencyToMask,
  empty,
  formatCurrency,
  maskCep,
  maskChassis,
  maskCnpj,
  maskCurrency,
  maskYear,
  onlyDigits,
  parseCurrency,
} from '@/lib/format'

describe('onlyDigits', () => {
  it('remove tudo que nao for digito', () => {
    expect(onlyDigits('11.222.333/0001-81')).toBe('11222333000181')
  })
})

describe('maskCnpj', () => {
  it('formata progressivamente enquanto digita', () => {
    expect(maskCnpj('11')).toBe('11')
    expect(maskCnpj('11222')).toBe('11.222')
    expect(maskCnpj('11222333')).toBe('11.222.333')
    expect(maskCnpj('112223330001')).toBe('11.222.333/0001')
    expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('descarta digitos alem de 14', () => {
    expect(maskCnpj('112223330001819999')).toBe('11.222.333/0001-81')
  })
})

describe('maskCep', () => {
  it('insere o hifen apos cinco digitos', () => {
    expect(maskCep('58400')).toBe('58400')
    expect(maskCep('58400500')).toBe('58400-500')
  })

  it('limita a oito digitos', () => {
    expect(maskCep('584005001234')).toBe('58400-500')
  })
})

describe('maskCurrency e parseCurrency', () => {
  it('trata a entrada como centavos', () => {
    expect(maskCurrency('1')).toBe('0,01')
    expect(maskCurrency('12345')).toBe('123,45')
    expect(maskCurrency('10999000')).toBe('109.990,00')
  })

  it('devolve string vazia quando nao ha digitos', () => {
    expect(maskCurrency('')).toBe('')
    expect(maskCurrency('abc')).toBe('')
  })

  it('converte a mascara de volta para numero', () => {
    expect(parseCurrency('109.990,00')).toBe(109990)
    expect(parseCurrency('0,01')).toBe(0.01)
  })

  it('devolve null quando nao ha valor', () => {
    expect(parseCurrency('')).toBeNull()
  })

  it('faz ida e volta sem perder valor', () => {
    expect(parseCurrency(currencyToMask(109990))).toBe(109990)
    expect(currencyToMask(null)).toBe('')
  })
})

describe('formatCurrency', () => {
  it('formata em real brasileiro', () => {
    expect(formatCurrency(109990).replace(/ /g, ' ')).toBe('R$ 109.990,00')
  })

  it('usa travessao quando o valor e nulo', () => {
    expect(formatCurrency(null)).toBe('—')
  })
})

describe('maskChassis', () => {
  it('remove simbolos, sobe para maiuscula e limita a 17', () => {
    expect(maskChassis('9bd-1122.3344/000019999')).toBe('9BD11223344000019')
  })
})

describe('maskYear', () => {
  it('mantem no maximo quatro digitos', () => {
    expect(maskYear('2025')).toBe('2025')
    expect(maskYear('20255')).toBe('2025')
    expect(maskYear('20a25')).toBe('2025')
  })
})

describe('empty', () => {
  it('substitui nulo e vazio por travessao', () => {
    expect(empty(null)).toBe('—')
    expect(empty('')).toBe('—')
    expect(empty(2025)).toBe('2025')
  })
})
