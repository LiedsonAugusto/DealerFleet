import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError, dealersApi, vehiclesApi } from '@/api'
import { DealerDetailPage } from '@/pages/dealers/dealer-detail-page'
import { renderWithProviders } from '@/test/render'
import type { Dealer, Page, Vehicle } from '@/types'

function pageOf(content: Vehicle[]): Page<Vehicle> {
  return {
    content,
    page: 1,
    size: 100,
    totalElements: content.length,
    totalPages: 1,
  }
}

const { navigate, params } = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: { current: {} as Record<string, string | undefined> },
}))

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()

  return {
    ...actual,
    useNavigate: () => navigate,
    useParams: () => params.current,
  }
})

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()

  return {
    ...actual,
    dealersApi: { ...actual.dealersApi, get: vi.fn(), vehicles: vi.fn() },
    vehiclesApi: {
      ...actual.vehiclesApi,
      list: vi.fn(),
      assignDealer: vi.fn(),
      unassignDealer: vi.fn(),
    },
  }
})

const BETIM: Dealer = {
  id: 'dealer-betim',
  corporateName: 'Stellantis Betim Veículos',
  cnpj: '11222333000181',
  cnpjFormatted: '11.222.333/0001-81',
  vehicleCount: 0,
  address: {
    cep: '32669900',
    cepFormatted: '32669-900',
    street: 'Avenida Contorno',
    number: '3455',
    complement: null,
    neighborhood: 'Distrito Industrial',
    city: 'Betim',
    state: 'MG',
  },
}

function vehicle(id: string, overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id,
    brand: 'Fiat',
    model: 'Argo',
    fuelType: 'FLEX',
    color: 'Prata',
    year: 2025,
    chassis: null,
    price: 90000,
    externalColor: null,
    dealerId: BETIM.id,
    ...overrides,
  }
}

const PULSE = vehicle('v-pulse', { model: 'Pulse', price: 110000 })
const ARGO = vehicle('v-argo', { model: 'Argo', price: 90000 })
const LIVRE = vehicle('v-livre', { brand: 'Jeep', model: 'Renegade', dealerId: null })

const VINCULADOS = [PULSE, ARGO]

function rowsInBody() {
  const table = screen.getByRole('table')
  const body = within(table).getAllByRole('rowgroup')[1]
  return within(body).getAllByRole('row')
}

describe('DealerDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    params.current = { id: BETIM.id }
    vi.mocked(dealersApi.get).mockResolvedValue(BETIM)
    vi.mocked(dealersApi.vehicles).mockResolvedValue(VINCULADOS)
    vi.mocked(vehiclesApi.list).mockResolvedValue(pageOf([LIVRE]))
    vi.mocked(vehiclesApi.assignDealer).mockResolvedValue({ ...LIVRE, dealerId: BETIM.id })
    vi.mocked(vehiclesApi.unassignDealer).mockResolvedValue({ ...PULSE, dealerId: null })
  })

  it('mostra os dados cadastrais da concessionaria', async () => {
    renderWithProviders(<DealerDetailPage />)

    expect(await screen.findByText('Stellantis Betim Veículos')).toBeInTheDocument()
    expect(screen.getByText('CNPJ 11.222.333/0001-81')).toBeInTheDocument()

    const endereco = screen.getByText('Endereço').closest('div') as HTMLElement
    expect(within(endereco).getByText('32669-900')).toBeInTheDocument()
    expect(within(endereco).getByText('Avenida Contorno, 3455')).toBeInTheDocument()
    expect(within(endereco).getByText('Distrito Industrial')).toBeInTheDocument()
    expect(within(endereco).getByText('—')).toBeInTheDocument()
  })

  it('resume a frota da concessionaria nos indicadores', async () => {
    renderWithProviders(<DealerDetailPage />)

    const frota = await screen.findByRole('group', { name: 'Veículos vinculados' })
    expect(await within(frota).findByText('2')).toBeInTheDocument()

    const estoque = screen.getByRole('group', { name: 'Valor em estoque' })
    expect(within(estoque).getByText('R$ 200.000,00')).toBeInTheDocument()

    const local = screen.getByRole('group', { name: 'Localização' })
    expect(within(local).getByText('Betim / MG')).toBeInTheDocument()
  })

  it('lista apenas os veiculos vinculados a esta concessionaria', async () => {
    renderWithProviders(<DealerDetailPage />)

    await waitFor(() => expect(rowsInBody()).toHaveLength(2))
    expect(screen.getByText('Pulse')).toBeInTheDocument()
    expect(screen.getByText('Argo')).toBeInTheDocument()
    expect(screen.queryByText('208')).not.toBeInTheDocument()
    expect(dealersApi.vehicles).toHaveBeenCalledWith(BETIM.id)
  })

  it('o seletor oferece apenas veiculos sem concessionaria', async () => {
    renderWithProviders(<DealerDetailPage />)

    const seletor = await screen.findByLabelText('Vincular veículo')

    await waitFor(() =>
      expect(within(seletor).getByRole('option', { name: 'Jeep Renegade' })).toBeInTheDocument(),
    )
    expect(within(seletor).queryByRole('option', { name: 'Fiat Pulse' })).not.toBeInTheDocument()
    expect(within(seletor).queryByRole('option', { name: 'Peugeot 208' })).not.toBeInTheDocument()
  })

  it('vincular fica bloqueado ate escolher um veiculo', async () => {
    renderWithProviders(<DealerDetailPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(2))

    expect(screen.getByRole('button', { name: /Vincular/ })).toBeDisabled()
  })

  it('vincula o veiculo escolhido a esta concessionaria', async () => {
    renderWithProviders(<DealerDetailPage />)
    const seletor = await screen.findByLabelText('Vincular veículo')
    await waitFor(() =>
      expect(within(seletor).getByRole('option', { name: 'Jeep Renegade' })).toBeInTheDocument(),
    )

    await userEvent.selectOptions(seletor, LIVRE.id)
    await userEvent.click(screen.getByRole('button', { name: /Vincular/ }))

    await waitFor(() => expect(vehiclesApi.assignDealer).toHaveBeenCalledWith(LIVRE.id, BETIM.id))
    expect(await screen.findByRole('status')).toHaveTextContent('Jeep Renegade vinculado')
  })

  it('pede ao servidor apenas os veiculos sem vinculo para o seletor', async () => {
    renderWithProviders(<DealerDetailPage />)

    await screen.findByLabelText('Vincular veículo')

    expect(vehiclesApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ dealer: 'none' }),
    )
  })

  it('avisa quando nao ha veiculo disponivel para vincular', async () => {
    vi.mocked(vehiclesApi.list).mockResolvedValue(pageOf([]))
    renderWithProviders(<DealerDetailPage />)

    const seletor = await screen.findByLabelText('Vincular veículo')

    await waitFor(() => expect(seletor).toBeDisabled())
    expect(within(seletor).getByRole('option', { name: 'Nenhum veículo disponível' })).toBeInTheDocument()
  })

  it('desvincula o veiculo da concessionaria', async () => {
    renderWithProviders(<DealerDetailPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(2))

    await userEvent.click(within(rowsInBody()[0]).getByTitle('Desvincular da concessionária'))

    await waitFor(() => expect(vehiclesApi.unassignDealer).toHaveBeenCalledWith(PULSE.id))
    expect(await screen.findByRole('status')).toHaveTextContent('Fiat Pulse desvinculado')
  })

  it('avisa quando o vinculo falha na API', async () => {
    vi.mocked(vehiclesApi.assignDealer).mockRejectedValue(
      new ApiError('Concessionaria nao encontrada', 404, {}, 'req-1'),
    )
    renderWithProviders(<DealerDetailPage />)
    const seletor = await screen.findByLabelText('Vincular veículo')
    await waitFor(() =>
      expect(within(seletor).getByRole('option', { name: 'Jeep Renegade' })).toBeInTheDocument(),
    )

    await userEvent.selectOptions(seletor, LIVRE.id)
    await userEvent.click(screen.getByRole('button', { name: /Vincular/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Concessionaria nao encontrada')
  })

  it('mostra estado vazio quando nenhum veiculo esta vinculado', async () => {
    vi.mocked(dealersApi.vehicles).mockResolvedValue([])
    renderWithProviders(<DealerDetailPage />)

    expect(await screen.findByText('Nenhum veículo vinculado')).toBeInTheDocument()
  })

  it('mostra o erro quando a concessionaria nao carrega', async () => {
    vi.mocked(dealersApi.get).mockRejectedValue(new Error('Concessionaria nao encontrada'))
    renderWithProviders(<DealerDetailPage />)

    expect(await screen.findByText('Não foi possível carregar os dados')).toBeInTheDocument()
    expect(screen.getByText('Concessionaria nao encontrada')).toBeInTheDocument()
  })

  it('navega para a listagem e para a edicao pelo cabecalho', async () => {
    renderWithProviders(<DealerDetailPage />)
    await screen.findByText('Stellantis Betim Veículos')

    await userEvent.click(screen.getByRole('button', { name: /Voltar/ }))
    expect(navigate).toHaveBeenCalledWith('/dealers')

    await userEvent.click(screen.getByRole('button', { name: /Editar/ }))
    expect(navigate).toHaveBeenCalledWith(`/dealers/${BETIM.id}/edit`)
  })
})
