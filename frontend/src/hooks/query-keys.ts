export const dealerKeys = {
  all: ['dealers'] as const,
  list: () => [...dealerKeys.all, 'list'] as const,
  detail: (id: string) => [...dealerKeys.all, 'detail', id] as const,
  vehicles: (id: string) => [...dealerKeys.all, 'vehicles', id] as const,
}

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: (dealerId: string | null) => [...vehicleKeys.all, 'list', dealerId] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
}
