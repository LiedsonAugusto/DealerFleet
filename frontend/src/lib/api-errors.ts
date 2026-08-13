import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/api'

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Erro inesperado'
}

export function errorDetail(error: unknown): string | undefined {
  if (error instanceof ApiError && error.requestId) {
    return `Requisição ${error.requestId}`
  }
  return undefined
}

export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError)) {
    return false
  }

  const entries = Object.entries(error.fieldErrors)
  entries.forEach(([field, message]) => {
    setError(field as Path<T>, { type: 'server', message })
  })

  return entries.length > 0
}
