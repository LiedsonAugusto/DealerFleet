import { describe, expect, it } from 'vitest'
import { isValidCnpj } from '@/lib/cnpj'

describe('isValidCnpj', () => {
  it('aceita CNPJ valido sem formatacao', () => {
    expect(isValidCnpj('11222333000181')).toBe(true)
  })

  it('aceita CNPJ valido formatado', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
  })

  it('rejeita quando o primeiro digito verificador esta errado', () => {
    expect(isValidCnpj('11222333000171')).toBe(false)
  })

  it('rejeita quando o segundo digito verificador esta errado', () => {
    expect(isValidCnpj('11222333000182')).toBe(false)
  })

  it('rejeita sequencias de digitos repetidos', () => {
    expect(isValidCnpj('11111111111111')).toBe(false)
    expect(isValidCnpj('00000000000000')).toBe(false)
  })

  it('rejeita quantidade de digitos diferente de 14', () => {
    expect(isValidCnpj('112223330001')).toBe(false)
    expect(isValidCnpj('112223330001812')).toBe(false)
    expect(isValidCnpj('')).toBe(false)
  })

  it('ignora caracteres nao numericos ao validar', () => {
    expect(isValidCnpj('11 222 333 0001 81')).toBe(true)
  })
})
