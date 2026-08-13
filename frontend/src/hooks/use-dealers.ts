import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dealersApi } from '@/api'
import { dealerKeys, vehicleKeys } from '@/hooks/query-keys'
import type { DealerInput } from '@/types'

function useInvalidateDealers() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({ queryKey: dealerKeys.all })
    await queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
  }
}

export function useDealers() {
  return useQuery({
    queryKey: dealerKeys.list(),
    queryFn: dealersApi.list,
  })
}

export function useDealer(id: string | undefined) {
  return useQuery({
    queryKey: dealerKeys.detail(id ?? ''),
    queryFn: () => dealersApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useDealerVehicles(id: string | undefined) {
  return useQuery({
    queryKey: dealerKeys.vehicles(id ?? ''),
    queryFn: () => dealersApi.vehicles(id!),
    enabled: Boolean(id),
  })
}

export function useCreateDealer() {
  const invalidate = useInvalidateDealers()

  return useMutation({
    mutationFn: (input: DealerInput) => dealersApi.create(input),
    onSuccess: invalidate,
  })
}

export function useUpdateDealer(id: string) {
  const invalidate = useInvalidateDealers()

  return useMutation({
    mutationFn: (input: DealerInput) => dealersApi.update(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteDealer() {
  const invalidate = useInvalidateDealers()

  return useMutation({
    mutationFn: (id: string) => dealersApi.remove(id),
    onSuccess: invalidate,
  })
}
