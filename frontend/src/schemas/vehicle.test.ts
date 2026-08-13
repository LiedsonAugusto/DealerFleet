import { describe, expect, it } from 'vitest'
import type { VehicleFormValues } from '@/schemas/vehicle'
import { MAX_YEAR, toVehicleFormValues, toVehicleInput, vehicleSchema } from '@/schemas/vehicle'
import type { Vehicle } from '@/types'

function form(overrides: Partial<VehicleFormValues> = {}): VehicleFormValues {
  return {
    brand: 'Fiat',
    model: 'Pulse Drive 1.3',
    fuelType: 'FLEX',
    color: 'Vermelho Montecarlo',
    year: '',
    chassis: '',
    price: '',
    externalColor: '',
    dealerId: '',
    ...overrides,
  }
}

describe('vehicleSchema', () => {
  it('aceita apenas os campos obrigatorios preenchidos', () => {
    expect(vehicleSchema.safeParse(form()).success).toBe(true)
  })

  it('exige marca, modelo e cor', () => {
    expect(vehicleSchema.safeParse(form({ brand: '   ' })).success).toBe(false)
    expect(vehicleSchema.safeParse(form({ model: '' })).success).toBe(false)
    expect(vehicleSchema.safeParse(form({ color: '' })).success).toBe(false)
  })

  it('exige combustivel dentro do enum', () => {
    const result = vehicleSchema.safeParse({ ...form(), fuelType: 'ALCOOL' })
    expect(result.success).toBe(false)
  })

  it('aceita ano vazio mas rejeita fora da faixa', () => {
    expect(vehicleSchema.safeParse(form({ year: '' })).success).toBe(true)
    expect(vehicleSchema.safeParse(form({ year: '2025' })).success).toBe(true)
    expect(vehicleSchema.safeParse(form({ year: '1899' })).success).toBe(false)
    expect(vehicleSchema.safeParse(form({ year: String(MAX_YEAR + 1) })).success).toBe(false)
  })

  it('exige exatamente 17 caracteres alfanumericos no chassi', () => {
    expect(vehicleSchema.safeParse(form({ chassis: '' })).success).toBe(true)
    expect(vehicleSchema.safeParse(form({ chassis: '9BD11223344000001' })).success).toBe(true)
    expect(vehicleSchema.safeParse(form({ chassis: '9BD1122334400000' })).success).toBe(false)
  })

  it('rejeita valor zerado', () => {
    expect(vehicleSchema.safeParse(form({ price: '0,00' })).success).toBe(false)
    expect(vehicleSchema.safeParse(form({ price: '109.990,00' })).success).toBe(true)
  })

  it('devolve a mensagem do campo que falhou', () => {
    const result = vehicleSchema.safeParse(form({ brand: '' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Marca é obrigatória')
    }
  })
})

describe('toVehicleInput', () => {
  it('converte campos opcionais vazios em null', () => {
    expect(toVehicleInput(form())).toEqual({
      brand: 'Fiat',
      model: 'Pulse Drive 1.3',
      fuelType: 'FLEX',
      color: 'Vermelho Montecarlo',
      year: null,
      chassis: null,
      price: null,
      externalColor: null,
      dealerId: null,
    })
  })

  it('converte a mascara de valor em numero', () => {
    expect(toVehicleInput(form({ price: '109.990,00' })).price).toBe(109990)
  })

  it('converte ano em numero e remove espacos das strings', () => {
    const input = toVehicleInput(form({ year: '2025', brand: '  Jeep  ' }))

    expect(input.year).toBe(2025)
    expect(input.brand).toBe('Jeep')
  })
})

describe('toVehicleFormValues', () => {
  it('reidrata o formulario a partir da resposta da API', () => {
    const vehicle: Vehicle = {
      id: 'abc',
      brand: 'Fiat',
      model: 'Toro Freedom',
      fuelType: 'DIESEL',
      color: 'Cinza',
      year: 2025,
      chassis: '9BD11223344000003',
      price: 189900,
      externalColor: null,
      dealerId: null,
    }

    expect(toVehicleFormValues(vehicle)).toEqual({
      brand: 'Fiat',
      model: 'Toro Freedom',
      fuelType: 'DIESEL',
      color: 'Cinza',
      year: '2025',
      chassis: '9BD11223344000003',
      price: '189.900,00',
      externalColor: '',
      dealerId: '',
    })
  })
})
