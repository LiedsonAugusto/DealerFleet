import { z } from 'zod'
import { isValidCnpj } from '@/lib/cnpj'
import { onlyDigits } from '@/lib/format'
import { BRAZILIAN_STATES } from '@/lib/states'
import type { Dealer, DealerInput } from '@/types'

const STATES = new Set<string>(BRAZILIAN_STATES)

export const dealerSchema = z.object({
  corporateName: z
    .string()
    .trim()
    .min(1, 'Razão social é obrigatória')
    .max(150, 'Razão social deve ter no máximo 150 caracteres'),

  cnpj: z
    .string()
    .min(1, 'CNPJ é obrigatório')
    .refine((value) => onlyDigits(value).length === 14, 'CNPJ deve conter 14 dígitos')
    .refine(isValidCnpj, 'CNPJ inválido'),

  address: z.object({
    cep: z
      .string()
      .min(1, 'CEP é obrigatório')
      .refine((value) => onlyDigits(value).length === 8, 'CEP deve conter 8 dígitos'),

    street: z
      .string()
      .trim()
      .min(1, 'Logradouro é obrigatório')
      .max(150, 'Logradouro deve ter no máximo 150 caracteres'),

    number: z.string().trim().max(20, 'Número deve ter no máximo 20 caracteres'),

    complement: z.string().trim().max(100, 'Complemento deve ter no máximo 100 caracteres'),

    neighborhood: z
      .string()
      .trim()
      .min(1, 'Bairro é obrigatório')
      .max(100, 'Bairro deve ter no máximo 100 caracteres'),

    city: z
      .string()
      .trim()
      .min(1, 'Cidade é obrigatória')
      .max(100, 'Cidade deve ter no máximo 100 caracteres'),

    state: z
      .string()
      .min(1, 'Selecione o estado')
      .refine((value) => STATES.has(value), 'Estado inválido'),
  }),
})

export type DealerFormValues = z.infer<typeof dealerSchema>

export function toDealerInput(values: DealerFormValues): DealerInput {
  return {
    corporateName: values.corporateName.trim(),
    cnpj: onlyDigits(values.cnpj),
    address: {
      cep: onlyDigits(values.address.cep),
      street: values.address.street.trim(),
      number: values.address.number.trim() === '' ? null : values.address.number.trim(),
      complement:
        values.address.complement.trim() === '' ? null : values.address.complement.trim(),
      neighborhood: values.address.neighborhood.trim(),
      city: values.address.city.trim(),
      state: values.address.state,
    },
  }
}

export function toDealerFormValues(dealer: Dealer) {
  return {
    corporateName: dealer.corporateName,
    cnpj: dealer.cnpjFormatted,
    address: {
      cep: dealer.address.cepFormatted,
      street: dealer.address.street,
      number: dealer.address.number ?? '',
      complement: dealer.address.complement ?? '',
      neighborhood: dealer.address.neighborhood,
      city: dealer.address.city,
      state: dealer.address.state,
    },
  }
}
