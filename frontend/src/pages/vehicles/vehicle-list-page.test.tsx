import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dealersApi, vehiclesApi } from '@/api'
import { VehicleListPage } from '@/pages/vehicles/vehicle-list-page'
import { renderWithProviders } from '@/test/render'
import type { Dealer, Vehicle } from '@/types'

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()

  return {
    ...actual,
    vehiclesApi: { ...actual.vehiclesApi, list: vi.fn(), remove: vi.fn() },
    dealersApi: { ...actual.dealersApi, list: vi.fn() },
  }
})

const BETIM: Dealer = {
  id: 'dealer-betim',
  corporateName: 'Stellantis Betim',
  cnpj: '11222333000181',
  cnpjFormatted: '11.222.333/0001-81',
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

function vehicle(index: number, overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: `v-${index}`,
    brand: `Marca${index}`,
    model: `Modelo ${index}`,
    fuelType: 'FLEX',
    color: 'Branco',
    year: 2020 + (index % 5),
    chassis: null,
    price: index * 1000,
    externalColor: null,
    dealerId: BETIM.id,
    ...overrides,
  }
}

const VEHICLES: Vehicle[] = [
  ...Array.from({ length: 11 }, (_, index) => vehicle(index + 1)),
  vehicle(12, { brand: 'Jeep', model: 'Compass', fuelType: 'DIESEL', dealerId: null, price: null }),
]

function rowsInBody() {
  const table = screen.getByRole('table')
  const body = within(table).getAllByRole('rowgroup')[1]
  return within(body).getAllByRole('row')
}

describe('VehicleListPage', () => {
  beforeEach(() => {
    vi.mocked(vehiclesApi.list).mockResolvedValue(VEHICLES)
    vi.mocked(dealersApi.list).mockResolvedValue([BETIM])
  })

  it('resume a frota nos indicadores do topo', async () => {
    renderWithProviders(<VehicleListPage />)

    const frota = await screen.findByRole('group', { name: 'Veículos' })
    expect(await within(frota).findByText('12')).toBeInTheDocument()

    const semVinculo = screen.getByRole('group', { name: 'Sem vínculo' })
    expect(within(semVinculo).getByText('1')).toBeInTheDocument()
    expect(within(semVinculo).getByText('Aguardando concessionária')).toBeInTheDocument()
  })

  it('mostra dez linhas por pagina por padrao', async () => {
    renderWithProviders(<VehicleListPage />)

    await waitFor(() => expect(rowsInBody()).toHaveLength(10))
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 1–10 de 12')
  })

  it('navega para a segunda pagina', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() => expect(rowsInBody()).toHaveLength(2))
    expect(screen.getByText('Compass')).toBeInTheDocument()
  })

  it('filtra pela busca global', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.type(screen.getByLabelText(/Buscar marca/), 'compass')

    await waitFor(() => expect(rowsInBody()).toHaveLength(1))
    expect(screen.getByText('Jeep')).toBeInTheDocument()
  })

  it('filtra pela coluna de combustivel', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por combustível'), 'DIESEL')

    await waitFor(() => expect(rowsInBody()).toHaveLength(1))
    expect(screen.getByText('Compass')).toBeInTheDocument()
  })

  it('ordena por valor jogando os veiculos sem preco para o fim', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por Valor' }))
    await waitFor(() => expect(within(rowsInBody()[0]).getByText('Marca1')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por Valor' }))
    await waitFor(() => expect(within(rowsInBody()[0]).getByText('Marca11')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: '2' }))
    await waitFor(() => expect(within(rowsInBody()[1]).getByText('Jeep')).toBeInTheDocument())
  })

  it('avisa quando nenhum veiculo corresponde aos filtros', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.type(screen.getByLabelText(/Buscar marca/), 'inexistente')

    expect(await screen.findByText('Nenhum veículo corresponde aos filtros')).toBeInTheDocument()
  })

  it('mostra estado vazio quando a frota nao tem veiculos', async () => {
    vi.mocked(vehiclesApi.list).mockResolvedValue([])
    renderWithProviders(<VehicleListPage />)

    expect(await screen.findByText('Nenhum veículo cadastrado')).toBeInTheDocument()
  })

  it('mostra mensagem de erro vinda da API', async () => {
    vi.mocked(vehiclesApi.list).mockRejectedValue(new Error('Servidor fora do ar'))
    renderWithProviders(<VehicleListPage />)

    expect(await screen.findByText('Não foi possível carregar os dados')).toBeInTheDocument()
    expect(screen.getByText('Servidor fora do ar')).toBeInTheDocument()
  })

  it('pede confirmacao antes de excluir e chama a API ao confirmar', async () => {
    vi.mocked(vehiclesApi.remove).mockResolvedValue(undefined)
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.click(within(rowsInBody()[0]).getByTitle('Excluir veículo'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/será removido permanentemente/)).toBeInTheDocument()
    expect(vehiclesApi.remove).not.toHaveBeenCalled()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(vehiclesApi.remove).toHaveBeenCalledWith('v-1'))
  })
})
