import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError, dealersApi, vehiclesApi } from '@/api'
import { DealerListPage } from '@/pages/dealers/dealer-list-page'
import { renderWithProviders } from '@/test/render'
import type { Dealer, Vehicle } from '@/types'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()

  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()

  return {
    ...actual,
    dealersApi: { ...actual.dealersApi, list: vi.fn(), remove: vi.fn() },
    vehiclesApi: { ...actual.vehiclesApi, list: vi.fn() },
  }
})

function dealer(
  id: string,
  corporateName: string,
  cnpj: string,
  city: string,
  state: string,
): Dealer {
  return {
    id,
    corporateName,
    cnpj,
    cnpjFormatted: `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`,
    address: {
      cep: '32669900',
      cepFormatted: '32669-900',
      street: 'Avenida Contorno',
      number: '3455',
      complement: null,
      neighborhood: 'Centro',
      city,
      state,
    },
  }
}

const BETIM = dealer('d-betim', 'Stellantis Betim Veículos', '11222333000181', 'Betim', 'MG')
const GOIANA = dealer('d-goiana', 'Goiana Motors', '22334455000186', 'Goiana', 'PE')
const PAULISTA = dealer('d-paulista', 'Comercial Paulista', '33445566000186', 'São Paulo', 'SP')

const DEALERS = [BETIM, GOIANA, PAULISTA]

function vehicle(id: string, dealerId: string | null): Vehicle {
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
    dealerId,
  }
}

const VEHICLES = [
  vehicle('v-1', BETIM.id),
  vehicle('v-2', BETIM.id),
  vehicle('v-3', GOIANA.id),
  vehicle('v-4', null),
]

function rowsInBody() {
  const table = screen.getByRole('table')
  const body = within(table).getAllByRole('rowgroup')[1]
  return within(body).getAllByRole('row')
}

describe('DealerListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dealersApi.list).mockResolvedValue(DEALERS)
    vi.mocked(vehiclesApi.list).mockResolvedValue(VEHICLES)
    vi.mocked(dealersApi.remove).mockResolvedValue(undefined)
  })

  it('resume a rede nos indicadores do topo', async () => {
    renderWithProviders(<DealerListPage />)

    const rede = await screen.findByRole('group', { name: 'Concessionárias' })
    expect(await within(rede).findByText('3')).toBeInTheDocument()

    const estados = screen.getByRole('group', { name: 'Estados atendidos' })
    expect(within(estados).getByText('3')).toBeInTheDocument()

    const vinculados = screen.getByRole('group', { name: 'Veículos vinculados' })
    expect(within(vinculados).getByText('3')).toBeInTheDocument()

    const media = screen.getByRole('group', { name: 'Média por unidade' })
    expect(within(media).getByText('1.0')).toBeInTheDocument()
  })

  it('conta os veiculos vinculados por concessionaria', async () => {
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    const betim = rowsInBody()[0]
    expect(within(betim).getByText('Stellantis Betim Veículos')).toBeInTheDocument()
    expect(within(betim).getByText('2')).toBeInTheDocument()

    const paulista = rowsInBody()[2]
    expect(within(paulista).getByText('0')).toBeInTheDocument()
  })

  it('filtra pela busca global usando razao social ou cidade', async () => {
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    await userEvent.type(screen.getByLabelText(/Buscar razão social/), 'goiana')

    await waitFor(() => expect(rowsInBody()).toHaveLength(1))
    expect(screen.getByText('Goiana Motors')).toBeInTheDocument()
  })

  it('busca por CNPJ mesmo quando digitado com mascara', async () => {
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    await userEvent.type(screen.getByLabelText(/Buscar razão social/), '11.222.333')

    await waitFor(() => expect(rowsInBody()).toHaveLength(1))
    expect(screen.getByText('Stellantis Betim Veículos')).toBeInTheDocument()
  })

  it('filtra pela coluna de estado', async () => {
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por estado'), 'PE')

    await waitFor(() => expect(rowsInBody()).toHaveLength(1))
    expect(screen.getByText('Goiana Motors')).toBeInTheDocument()
  })

  it('ordena pela quantidade de veiculos nos dois sentidos', async () => {
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por Veículos' }))
    await waitFor(() =>
      expect(within(rowsInBody()[0]).getByText('Comercial Paulista')).toBeInTheDocument(),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por Veículos' }))
    await waitFor(() =>
      expect(within(rowsInBody()[0]).getByText('Stellantis Betim Veículos')).toBeInTheDocument(),
    )
  })

  it('avisa quando nenhuma concessionaria corresponde aos filtros', async () => {
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    await userEvent.type(screen.getByLabelText(/Buscar razão social/), 'inexistente')

    expect(
      await screen.findByText('Nenhuma concessionária corresponde aos filtros'),
    ).toBeInTheDocument()
  })

  it('limpa os filtros aplicados', async () => {
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por estado'), 'PE')
    await waitFor(() => expect(rowsInBody()).toHaveLength(1))

    await userEvent.click(screen.getByRole('button', { name: /Limpar filtros/ }))

    await waitFor(() => expect(rowsInBody()).toHaveLength(3))
  })

  it('mostra estado vazio quando nao ha concessionarias', async () => {
    vi.mocked(dealersApi.list).mockResolvedValue([])
    renderWithProviders(<DealerListPage />)

    expect(await screen.findByText('Nenhuma concessionária cadastrada')).toBeInTheDocument()
  })

  it('mostra mensagem de erro vinda da API', async () => {
    vi.mocked(dealersApi.list).mockRejectedValue(new Error('Servidor fora do ar'))
    renderWithProviders(<DealerListPage />)

    expect(await screen.findByText('Não foi possível carregar os dados')).toBeInTheDocument()
    expect(screen.getByText('Servidor fora do ar')).toBeInTheDocument()
  })

  it('pede confirmacao antes de excluir e chama a API ao confirmar', async () => {
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    await userEvent.click(within(rowsInBody()[0]).getByTitle('Excluir concessionária'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/não podem ser excluídas/)).toBeInTheDocument()
    expect(dealersApi.remove).not.toHaveBeenCalled()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(dealersApi.remove).toHaveBeenCalledWith(BETIM.id))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Stellantis Betim Veículos excluída',
    )
  })

  it('avisa quando a API recusa excluir concessionaria com veiculos vinculados', async () => {
    vi.mocked(dealersApi.remove).mockRejectedValue(
      new ApiError(
        'Concessionaria possui 2 veiculo(s) vinculado(s). Desvincule antes de excluir.',
        409,
        {},
        'req-1',
      ),
    )
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    await userEvent.click(within(rowsInBody()[0]).getByTitle('Excluir concessionária'))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Concessionaria possui 2 veiculo(s) vinculado(s)',
    )
  })

  it('navega para o cadastro e para a edicao', async () => {
    renderWithProviders(<DealerListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(3))

    await userEvent.click(screen.getByRole('button', { name: /Nova concessionária/ }))
    expect(navigate).toHaveBeenCalledWith('/dealers/new')

    await userEvent.click(within(rowsInBody()[0]).getByTitle('Editar concessionária'))
    expect(navigate).toHaveBeenCalledWith(`/dealers/${BETIM.id}/edit`)
  })
})
