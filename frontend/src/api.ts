import type {
  AddressLookup,
  Dealer,
  DealerInput,
  Vehicle,
  VehicleInput,
} from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

type ProblemDetail = {
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>
  readonly requestId: string

  constructor(message: string, status: number, fieldErrors: Record<string, string>, requestId: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.requestId = requestId
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const requestId = crypto.randomUUID().slice(0, 8)

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      ...init?.headers,
    },
  }).catch(() => {
    throw new ApiError('Não foi possível conectar ao servidor', 0, {}, requestId)
  })

  if (!response.ok) {
    throw await toApiError(response, requestId)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function toApiError(response: Response, requestId: string): Promise<ApiError> {
  const problem = await response.json().catch(() => null) as ProblemDetail | null

  return new ApiError(
    problem?.detail ?? problem?.title ?? 'Erro inesperado ao comunicar com o servidor',
    response.status,
    problem?.errors ?? {},
    response.headers.get('X-Request-Id') ?? requestId,
  )
}

function body(payload: unknown): RequestInit {
  return { body: JSON.stringify(payload) }
}

export const dealersApi = {
  list: () => request<Dealer[]>('/dealer'),
  get: (id: string) => request<Dealer>(`/dealer/${id}`),
  create: (input: DealerInput) => request<Dealer>('/dealer', { method: 'POST', ...body(input) }),
  update: (id: string, input: DealerInput) =>
    request<Dealer>(`/dealer/${id}`, { method: 'PUT', ...body(input) }),
  remove: (id: string) => request<void>(`/dealer/${id}`, { method: 'DELETE' }),
  vehicles: (id: string) => request<Vehicle[]>(`/dealer/${id}/vehicles`),
}

export const vehiclesApi = {
  list: () => request<Vehicle[]>('/vehicles'),
  get: (id: string) => request<Vehicle>(`/vehicles/${id}`),
  create: (input: VehicleInput) => request<Vehicle>('/vehicles', { method: 'POST', ...body(input) }),
  update: (id: string, input: VehicleInput) =>
    request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', ...body(input) }),
  remove: (id: string) => request<void>(`/vehicles/${id}`, { method: 'DELETE' }),
  assignDealer: (id: string, dealerId: string) =>
    request<Vehicle>(`/vehicles/${id}/dealer`, { method: 'PUT', ...body({ dealerId }) }),
  unassignDealer: (id: string) => request<Vehicle>(`/vehicles/${id}/dealer`, { method: 'DELETE' }),
}

export const addressApi = {
  lookupCep: (cep: string) => request<AddressLookup>(`/cep/${cep.replace(/\D/g, '')}`),
}
