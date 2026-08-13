import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dealersApi, vehiclesApi } from '@/api'
import { dealerKeys, vehicleKeys } from '@/hooks/query-keys'
import type { VehicleInput } from '@/types'

function useInvalidateVehicles() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
    await queryClient.invalidateQueries({ queryKey: dealerKeys.all })
  }
}

export function useVehicles(dealerId: string | null = null) {
  return useQuery({
    queryKey: vehicleKeys.list(dealerId),
    queryFn: () => (dealerId ? dealersApi.vehicles(dealerId) : vehiclesApi.list()),
  })
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: vehicleKeys.detail(id ?? ''),
    queryFn: () => vehiclesApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useCreateVehicle() {
  const invalidate = useInvalidateVehicles()

  return useMutation({
    mutationFn: (input: VehicleInput) => vehiclesApi.create(input),
    onSuccess: invalidate,
  })
}

export function useUpdateVehicle(id: string) {
  const invalidate = useInvalidateVehicles()

  return useMutation({
    mutationFn: (input: VehicleInput) => vehiclesApi.update(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteVehicle() {
  const invalidate = useInvalidateVehicles()

  return useMutation({
    mutationFn: (id: string) => vehiclesApi.remove(id),
    onSuccess: invalidate,
  })
}

export function useAssignDealer() {
  const invalidate = useInvalidateVehicles()

  return useMutation({
    mutationFn: ({ id, dealerId }: { id: string; dealerId: string }) =>
      vehiclesApi.assignDealer(id, dealerId),
    onSuccess: invalidate,
  })
}

export function useUnassignDealer() {
  const invalidate = useInvalidateVehicles()

  return useMutation({
    mutationFn: (id: string) => vehiclesApi.unassignDealer(id),
    onSuccess: invalidate,
  })
}
