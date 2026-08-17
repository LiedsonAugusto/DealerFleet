import type { VehicleListParams } from '@/types'

export const dealerKeys = {
  all: ['dealers'] as const,
  list: () => [...dealerKeys.all, 'list'] as const,
  detail: (id: string) => [...dealerKeys.all, 'detail', id] as const,
  vehicles: (id: string) => [...dealerKeys.all, 'vehicles', id] as const,
}

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (params: VehicleListParams) => [...vehicleKeys.lists(), params] as const,
  summary: () => [...vehicleKeys.all, 'summary'] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
}
