import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi } from '@/api'
import { dealerKeys, vehicleKeys } from '@/hooks/query-keys'
import type { VehicleInput, VehicleListParams } from '@/types'

const UNASSIGNED_PARAMS: VehicleListParams = { dealer: 'none', size: 100 }

function useInvalidateVehicles() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
    await queryClient.invalidateQueries({ queryKey: dealerKeys.all })
  }
}

export function useVehicles(params: VehicleListParams = {}) {
  return useQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: () => vehiclesApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useVehicleSummary() {
  return useQuery({
    queryKey: vehicleKeys.summary(),
    queryFn: vehiclesApi.summary,
  })
}

export function useUnassignedVehicles() {
  return useQuery({
    queryKey: vehicleKeys.list(UNASSIGNED_PARAMS),
    queryFn: () => vehiclesApi.list(UNASSIGNED_PARAMS),
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
