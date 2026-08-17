export const FUEL_TYPES = ['GASOLINA', 'ETANOL', 'FLEX', 'DIESEL', 'ELETRICO', 'HIBRIDO'] as const

export type FuelType = (typeof FUEL_TYPES)[number]

export type Address = {
  cep: string
  cepFormatted: string
  street: string
  number: string | null
  complement: string | null
  neighborhood: string
  city: string
  state: string
}

export type Dealer = {
  id: string
  corporateName: string
  cnpj: string
  cnpjFormatted: string
  vehicleCount: number
  address: Address
}

export type DealerInput = {
  corporateName: string
  cnpj: string
  address: {
    cep: string
    street: string
    number?: string | null
    complement?: string | null
    neighborhood: string
    city: string
    state: string
  }
}

export type Vehicle = {
  id: string
  brand: string
  model: string
  fuelType: FuelType
  color: string
  year: number | null
  chassis: string | null
  price: number | null
  externalColor: string | null
  dealerId: string | null
}

export type VehicleInput = {
  brand: string
  model: string
  fuelType: FuelType
  color: string
  year?: number | null
  chassis?: string | null
  price?: number | null
  externalColor?: string | null
  dealerId?: string | null
}

export type Page<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type VehicleSummary = {
  total: number
  fleetValue: number
  unassigned: number
}

export type VehicleListParams = {
  page?: number
  size?: number
  sort?: string
  dir?: string
  q?: string
  brand?: string
  model?: string
  color?: string
  year?: string
  fuel?: string
  dealer?: string
}

export type AddressLookup = {
  cep: string
  cepFormatted: string
  street: string | null
  neighborhood: string | null
  city: string
  state: string
}
