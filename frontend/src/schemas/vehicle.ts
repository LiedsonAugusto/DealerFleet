import { z } from 'zod'
import { currencyToMask, onlyDigits, parseCurrency } from '@/lib/format'
import type { Vehicle, VehicleInput } from '@/types'
import { FUEL_TYPES } from '@/types'

const MIN_YEAR = 1900
export const MAX_YEAR = new Date().getFullYear() + 1

const blank = (value: string) => value.trim() === ''

export const vehicleSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(1, 'Marca é obrigatória')
    .max(60, 'Marca deve ter no máximo 60 caracteres'),

  model: z
    .string()
    .trim()
    .min(1, 'Modelo é obrigatório')
    .max(60, 'Modelo deve ter no máximo 60 caracteres'),

  fuelType: z.enum(FUEL_TYPES, { message: 'Selecione o tipo de combustível' }),

  color: z
    .string()
    .trim()
    .min(1, 'Cor é obrigatória')
    .max(40, 'Cor deve ter no máximo 40 caracteres'),

  year: z
    .string()
    .refine((value) => blank(value) || onlyDigits(value).length === 4, 'Ano deve ter 4 dígitos')
    .refine(
      (value) => blank(value) || (Number(value) >= MIN_YEAR && Number(value) <= MAX_YEAR),
      `Ano deve estar entre ${MIN_YEAR} e ${MAX_YEAR}`,
    ),

  chassis: z
    .string()
    .refine(
      (value) => blank(value) || /^[A-Z0-9]{17}$/.test(value),
      'Chassi deve conter 17 caracteres alfanuméricos',
    ),

  price: z
    .string()
    .refine(
      (value) => blank(value) || (parseCurrency(value) ?? 0) > 0,
      'Valor deve ser maior que zero',
    ),

  externalColor: z.string().trim().max(40, 'Cor externa deve ter no máximo 40 caracteres'),

  dealerId: z.string(),
})

export type VehicleFormValues = z.infer<typeof vehicleSchema>

export function toVehicleInput(values: VehicleFormValues): VehicleInput {
  return {
    brand: values.brand.trim(),
    model: values.model.trim(),
    fuelType: values.fuelType,
    color: values.color.trim(),
    year: blank(values.year) ? null : Number(values.year),
    chassis: blank(values.chassis) ? null : values.chassis,
    price: blank(values.price) ? null : parseCurrency(values.price),
    externalColor: blank(values.externalColor) ? null : values.externalColor.trim(),
    dealerId: values.dealerId === '' ? null : values.dealerId,
  }
}

export function toVehicleFormValues(vehicle: Vehicle) {
  return {
    brand: vehicle.brand,
    model: vehicle.model,
    fuelType: vehicle.fuelType,
    color: vehicle.color,
    year: vehicle.year === null ? '' : String(vehicle.year),
    chassis: vehicle.chassis ?? '',
    price: currencyToMask(vehicle.price),
    externalColor: vehicle.externalColor ?? '',
    dealerId: vehicle.dealerId ?? '',
  }
}
