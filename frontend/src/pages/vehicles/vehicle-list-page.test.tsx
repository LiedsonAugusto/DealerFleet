import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dealersApi, vehiclesApi } from '@/api'
import { VehicleListPage } from '@/pages/vehicles/vehicle-list-page'
import { renderWithProviders } from '@/test/render'
import type { Dealer, Page, Vehicle, VehicleListParams } from '@/types'

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()

  return {
    ...actual,
    vehiclesApi: { ...actual.vehiclesApi, list: vi.fn(), summary: vi.fn(), remove: vi.fn() },
    dealersApi: { ...actual.dealersApi, list: vi.fn() },
  }
})

const BETIM: Dealer = {
  id: 'dealer-betim',
  corporateName: 'Stellantis Betim',
  cnpj: '11222333000181',
  cnpjFormatted: '11.222.333/0001-81',
  vehicleCount: 11,
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

function matches(value: string | null, filter: string | undefined): boolean {
  return filter === undefined || (value ?? '').toLowerCase().includes(filter.toLowerCase())
}

function byPrice(rows: Vehicle[], descending: boolean): Vehicle[] {
  return [...rows].sort((a, b) => {
    if (a.price === null) {
      return 1
    }
    if (b.price === null) {
      return -1
    }
    return descending ? b.price - a.price : a.price - b.price
  })
}

function fakeServer(params: VehicleListParams = {}): Promise<Page<Vehicle>> {
  let rows = VEHICLES.filter(
    (item) =>
      matches(item.brand, params.brand)
      && matches(item.model, params.model)
      && matches(item.color, params.color)
      && matches(String(item.year), params.year)
      && (params.fuel === undefined || item.fuelType === params.fuel)
      && (params.q === undefined
        || [item.brand, item.model, item.color].some((field) => matches(field, params.q))),
  )

  if (params.dealer === 'none') {
    rows = rows.filter((item) => item.dealerId === null)
  } else if (params.dealer !== undefined) {
    rows = rows.filter((item) => item.dealerId === params.dealer)
  }

  if (params.sort === 'price') {
    rows = byPrice(rows, params.dir === 'desc')
  }

  const size = params.size ?? 10
  const page = params.page ?? 1

  return Promise.resolve({
    content: rows.slice((page - 1) * size, page * size),
    page,
    size,
    totalElements: rows.length,
    totalPages: Math.max(1, Math.ceil(rows.length / size)),
  })
}

function rowsInBody() {
  const table = screen.getByRole('table')
  const body = within(table).getAllByRole('rowgroup')[1]
  return within(body).getAllByRole('row')
}

function lastParams(): VehicleListParams {
  const calls = vi.mocked(vehiclesApi.list).mock.calls

  return calls[calls.length - 1][0] ?? {}
}

describe('VehicleListPage', () => {
  beforeEach(() => {
    vi.mocked(vehiclesApi.list).mockImplementation(fakeServer)
    vi.mocked(vehiclesApi.summary).mockResolvedValue({
      total: 12,
      fleetValue: 66000,
      unassigned: 1,
    })
    vi.mocked(dealersApi.list).mockResolvedValue([BETIM])
  })

  it('resume a frota inteira a partir do endpoint de totais, nao da pagina', async () => {
    renderWithProviders(<VehicleListPage />)

    const frota = await screen.findByRole('group', { name: 'Veículos' })
    expect(await within(frota).findByText('12')).toBeInTheDocument()

    const semVinculo = screen.getByRole('group', { name: 'Sem vínculo' })
    expect(within(semVinculo).getByText('1')).toBeInTheDocument()
    expect(within(semVinculo).getByText('Aguardando concessionária')).toBeInTheDocument()

    await waitFor(() => expect(rowsInBody()).toHaveLength(10))
    expect(vehiclesApi.summary).toHaveBeenCalled()
  })

  it('pede a primeira pagina com o tamanho padrao ao abrir', async () => {
    renderWithProviders(<VehicleListPage />)

    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    expect(lastParams()).toMatchObject({ page: 1, size: 10 })
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 1–10 de 12')
  })

  it('pede a pagina seguinte ao servidor em vez de fatiar em memoria', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() => expect(rowsInBody()).toHaveLength(2))
    expect(lastParams()).toMatchObject({ page: 2 })
    expect(screen.getByText('Compass')).toBeInTheDocument()
  })

  it('manda a busca global para o servidor e volta a primeira pagina', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.click(screen.getByRole('button', { name: '2' }))
    await waitFor(() => expect(rowsInBody()).toHaveLength(2))

    await userEvent.type(screen.getByLabelText(/Buscar marca/), 'compass')

    await waitFor(() => expect(rowsInBody()).toHaveLength(1))
    expect(lastParams()).toMatchObject({ q: 'compass', page: 1 })
    expect(screen.getByText('Jeep')).toBeInTheDocument()
  })

  it('manda o filtro de combustivel para o servidor', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por combustível'), 'DIESEL')

    await waitFor(() => expect(rowsInBody()).toHaveLength(1))
    expect(lastParams()).toMatchObject({ fuel: 'DIESEL' })
    expect(screen.getByText('Compass')).toBeInTheDocument()
  })

  it('manda ordenacao e direcao para o servidor a cada clique no cabecalho', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por Valor' }))
    await waitFor(() => expect(lastParams()).toMatchObject({ sort: 'price', dir: 'asc' }))
    await waitFor(() => expect(within(rowsInBody()[0]).getByText('Marca1')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por Valor' }))
    await waitFor(() => expect(lastParams()).toMatchObject({ sort: 'price', dir: 'desc' }))
    await waitFor(() => expect(within(rowsInBody()[0]).getByText('Marca11')).toBeInTheDocument())
  })

  it('agrupa as teclas digitadas em uma unica consulta ao servidor', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    const before = vi.mocked(vehiclesApi.list).mock.calls.length
    await userEvent.type(screen.getByLabelText(/Buscar marca/), 'compass')

    await waitFor(() => expect(lastParams()).toMatchObject({ q: 'compass' }))

    const requests = vi.mocked(vehiclesApi.list).mock.calls.length - before
    expect(requests).toBeLessThan('compass'.length)
  })

  it('nao oferece ordenacao pela coluna de concessionaria', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    expect(screen.getByText('Concessionária')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ordenar por Concessionária' })).toBeNull()
  })

  it('avisa quando nenhum veiculo corresponde aos filtros', async () => {
    renderWithProviders(<VehicleListPage />)
    await waitFor(() => expect(rowsInBody()).toHaveLength(10))

    await userEvent.type(screen.getByLabelText(/Buscar marca/), 'inexistente')

    expect(await screen.findByText('Nenhum veículo corresponde aos filtros')).toBeInTheDocument()
  })

  it('mostra estado vazio quando a frota nao tem veiculos', async () => {
    vi.mocked(vehiclesApi.summary).mockResolvedValue({ total: 0, fleetValue: 0, unassigned: 0 })
    vi.mocked(vehiclesApi.list).mockResolvedValue({
      content: [],
      page: 1,
      size: 10,
      totalElements: 0,
      totalPages: 1,
    })

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
