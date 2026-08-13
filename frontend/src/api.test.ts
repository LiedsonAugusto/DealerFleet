import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, dealersApi, vehiclesApi } from '@/api'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('cliente da API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('envia o cabecalho de correlacao em toda requisicao', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))

    await dealersApi.list()

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = init?.headers as Record<string, string>

    expect(headers['X-Request-Id']).toMatch(/^[0-9a-f]{8}$/)
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('serializa o corpo no POST', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: '1' }, 201))

    await vehiclesApi.create({
      brand: 'Fiat',
      model: 'Pulse',
      fuelType: 'FLEX',
      color: 'Vermelho',
    })

    const [, init] = vi.mocked(fetch).mock.calls[0]

    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toMatchObject({ brand: 'Fiat', model: 'Pulse' })
  })

  it('devolve undefined quando a resposta e 204', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))

    await expect(vehiclesApi.remove('abc')).resolves.toBeUndefined()
  })

  it('converte ProblemDetail em ApiError com os erros por campo', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          title: 'Dados invalidos',
          detail: 'Um ou mais campos nao passaram na validacao',
          errors: { corporateName: 'Razao social e obrigatoria' },
        },
        400,
      ),
    )

    await expect(dealersApi.list()).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(ApiError)
      const apiError = error as ApiError

      expect(apiError.status).toBe(400)
      expect(apiError.message).toBe('Um ou mais campos nao passaram na validacao')
      expect(apiError.fieldErrors).toEqual({ corporateName: 'Razao social e obrigatoria' })
      return true
    })
  })

  it('usa o title quando o ProblemDetail nao traz detail', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ title: 'Regra de negocio violada' }, 409))

    await expect(dealersApi.remove('abc')).rejects.toThrowError('Regra de negocio violada')
  })

  it('traduz falha de rede em ApiError com status zero', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(dealersApi.list()).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(0)
      expect((error as ApiError).message).toBe('Não foi possível conectar ao servidor')
      return true
    })
  })
})
