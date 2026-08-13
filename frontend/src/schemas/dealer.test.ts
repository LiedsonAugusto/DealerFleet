import { describe, expect, it } from 'vitest'
import type { DealerFormValues } from '@/schemas/dealer'
import { dealerSchema, toDealerFormValues, toDealerInput } from '@/schemas/dealer'
import type { Dealer } from '@/types'

function form(overrides: Partial<DealerFormValues> = {}): DealerFormValues {
  return {
    corporateName: 'Stellantis Betim Veículos',
    cnpj: '11.222.333/0001-81',
    address: {
      cep: '32669-900',
      street: 'Avenida Contorno',
      number: '3455',
      complement: '',
      neighborhood: 'Distrito Industrial',
      city: 'Betim',
      state: 'MG',
    },
    ...overrides,
  }
}

describe('dealerSchema', () => {
  it('aceita cadastro valido', () => {
    expect(dealerSchema.safeParse(form()).success).toBe(true)
  })

  it('rejeita CNPJ com digito verificador invalido', () => {
    const result = dealerSchema.safeParse(form({ cnpj: '11.222.333/0001-99' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('CNPJ inválido')
    }
  })

  it('rejeita CNPJ com menos de 14 digitos', () => {
    const result = dealerSchema.safeParse(form({ cnpj: '11.222.333' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('CNPJ deve conter 14 dígitos')
    }
  })

  it('rejeita CEP com quantidade errada de digitos', () => {
    const address = { ...form().address, cep: '3266-90' }
    expect(dealerSchema.safeParse(form({ address })).success).toBe(false)
  })

  it('rejeita UF fora da lista brasileira', () => {
    const address = { ...form().address, state: 'XX' }
    expect(dealerSchema.safeParse(form({ address })).success).toBe(false)
  })

  it('exige logradouro, bairro e cidade', () => {
    expect(
      dealerSchema.safeParse(form({ address: { ...form().address, street: '' } })).success,
    ).toBe(false)
    expect(
      dealerSchema.safeParse(form({ address: { ...form().address, neighborhood: '' } })).success,
    ).toBe(false)
    expect(
      dealerSchema.safeParse(form({ address: { ...form().address, city: '  ' } })).success,
    ).toBe(false)
  })
})

describe('toDealerInput', () => {
  it('envia CNPJ e CEP apenas com digitos', () => {
    const input = toDealerInput(form())

    expect(input.cnpj).toBe('11222333000181')
    expect(input.address.cep).toBe('32669900')
  })

  it('converte complemento e numero vazios em null', () => {
    const address = { ...form().address, number: '', complement: '' }
    const input = toDealerInput(form({ address }))

    expect(input.address.number).toBeNull()
    expect(input.address.complement).toBeNull()
  })
})

describe('toDealerFormValues', () => {
  it('reidrata o formulario usando os campos formatados da API', () => {
    const dealer: Dealer = {
      id: 'abc',
      corporateName: 'Rio Motors',
      cnpj: '44556677000186',
      cnpjFormatted: '44.556.677/0001-86',
      address: {
        cep: '20040020',
        cepFormatted: '20040-020',
        street: 'Praça Pio X',
        number: '119',
        complement: null,
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
      },
    }

    const values = toDealerFormValues(dealer)

    expect(values.cnpj).toBe('44.556.677/0001-86')
    expect(values.address.cep).toBe('20040-020')
    expect(values.address.complement).toBe('')
  })
})
