import { useMutation } from '@tanstack/react-query'
import { addressApi } from '@/api'

export function useCepLookup() {
  return useMutation({
    mutationFn: (cep: string) => addressApi.lookupCep(cep),
  })
}
