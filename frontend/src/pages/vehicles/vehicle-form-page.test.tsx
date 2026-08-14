import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError, dealersApi, vehiclesApi } from '@/api'
import { VehicleFormPage } from '@/pages/vehicles/vehicle-form-page'
import { renderWithProviders } from '@/test/render'
import type { Dealer, Vehicle } from '@/types'

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
    dealersApi: { ...actual.dealersApi, list: vi.fn() },
    vehiclesApi: { ...actual.vehiclesApi, get: vi.fn(), create: vi.fn(), update: vi.fn() },
  }
})

function dealer(id: string, corporateName: string): Dealer {
  return {
    id,
    corporateName,
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
}

const BETIM = dealer('dealer-betim', 'Stellantis Betim Veículos')
const GOIANA = dealer('dealer-goiana', 'Goiana Motors')

const PULSE: Vehicle = {
  id: 'v-pulse',
  brand: 'Fiat',
  model: 'Pulse Drive 1.3',
  fuelType: 'FLEX',
  color: 'Vermelho Montecarlo',
  year: 2025,
  chassis: '9BD11223344000001',
  price: 109990,
  externalColor: 'Preto Vulcano',
  dealerId: BETIM.id,
}

const field = {
  brand: () => screen.getByLabelText(/^Marca/),
  model: () => screen.getByLabelText(/^Modelo/),
  fuelType: () => screen.getByLabelText(/^Tipo de combustível/),
  color: () => screen.getByLabelText(/^Cor$|^Cor\*/),
  year: () => screen.getByLabelText(/^Ano/),
  chassis: () => screen.getByLabelText(/^Chassi/),
  price: () => screen.getByLabelText(/^Valor/),
  externalColor: () => screen.getByLabelText(/^Cor externa/),
  dealer: () => screen.getByLabelText(/^Concessionária/),
}

async function fillRequired() {
  await userEvent.type(field.brand(), 'Fiat')
  await userEvent.type(field.model(), 'Pulse Drive 1.3')
  await userEvent.selectOptions(field.fuelType(), 'FLEX')
  await userEvent.type(field.color(), 'Vermelho Montecarlo')
}

describe('VehicleFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    params.current = {}
    vi.mocked(dealersApi.list).mockResolvedValue([BETIM, GOIANA])
    vi.mocked(vehiclesApi.get).mockResolvedValue(PULSE)
    vi.mocked(vehiclesApi.create).mockResolvedValue(PULSE)
    vi.mocked(vehiclesApi.update).mockResolvedValue(PULSE)
  })

  it('oferece as concessionarias cadastradas e a opcao sem vinculo', async () => {
    renderWithProviders(<VehicleFormPage />)

    const seletor = await screen.findByLabelText(/^Concessionária/)

    expect(within(seletor).getByRole('option', { name: 'Sem vínculo' })).toBeInTheDocument()
    expect(
      within(seletor).getByRole('option', { name: 'Stellantis Betim Veículos' }),
    ).toBeInTheDocument()
    expect(within(seletor).getByRole('option', { name: 'Goiana Motors' })).toBeInTheDocument()
  })

  it('oferece apenas os combustiveis do enum', async () => {
    renderWithProviders(<VehicleFormPage />)

    const seletor = await screen.findByLabelText(/^Tipo de combustível/)
    const opcoes = within(seletor)
      .getAllByRole('option')
      .map((option) => option.textContent)

    expect(opcoes).toEqual([
      'Selecione',
      'Gasolina',
      'Etanol',
      'Flex',
      'Diesel',
      'Elétrico',
      'Híbrido',
    ])
  })

  it('exige os campos obrigatorios antes de enviar', async () => {
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText('Marca é obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Modelo é obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Selecione o tipo de combustível')).toBeInTheDocument()
    expect(screen.getByText('Cor é obrigatória')).toBeInTheDocument()
    expect(vehiclesApi.create).not.toHaveBeenCalled()
  })

  it('recusa chassi fora do formato de 17 caracteres', async () => {
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await fillRequired()
    await userEvent.type(field.chassis(), '9BD1122334400000')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(
      await screen.findByText('Chassi deve conter 17 caracteres alfanuméricos'),
    ).toBeInTheDocument()
    expect(vehiclesApi.create).not.toHaveBeenCalled()
  })

  it('recusa ano fora da faixa permitida', async () => {
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await fillRequired()
    await userEvent.type(field.year(), '1899')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText(/Ano deve estar entre 1900 e/)).toBeInTheDocument()
    expect(vehiclesApi.create).not.toHaveBeenCalled()
  })

  it('cadastra sem vinculo enviando os opcionais como nulos', async () => {
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    await waitFor(() => expect(vehiclesApi.create).toHaveBeenCalledTimes(1))
    expect(vehiclesApi.create).toHaveBeenCalledWith({
      brand: 'Fiat',
      model: 'Pulse Drive 1.3',
      fuelType: 'FLEX',
      color: 'Vermelho Montecarlo',
      year: null,
      chassis: null,
      price: null,
      externalColor: null,
      dealerId: null,
    })
  })

  it('cadastra ja vinculado a concessionaria escolhida', async () => {
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await fillRequired()
    await userEvent.selectOptions(field.dealer(), GOIANA.id)
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    await waitFor(() => expect(vehiclesApi.create).toHaveBeenCalledTimes(1))
    expect(vi.mocked(vehiclesApi.create).mock.calls[0][0].dealerId).toBe(GOIANA.id)
  })

  it('converte a mascara de valor em numero antes de enviar', async () => {
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await fillRequired()
    await userEvent.type(field.price(), '10999000')

    expect(field.price()).toHaveValue('109.990,00')

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    await waitFor(() => expect(vehiclesApi.create).toHaveBeenCalledTimes(1))
    expect(vi.mocked(vehiclesApi.create).mock.calls[0][0].price).toBe(109990)
  })

  it('normaliza o chassi para maiusculas ao digitar', async () => {
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await userEvent.type(field.chassis(), '9bd11223344000001')

    expect(field.chassis()).toHaveValue('9BD11223344000001')
  })

  it('notifica e volta para a listagem apos cadastrar', async () => {
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Fiat Pulse Drive 1.3 cadastrado')
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/vehicles'))
  })

  it('mostra no campo o erro devolvido pela API', async () => {
    vi.mocked(vehiclesApi.create).mockRejectedValue(
      new ApiError('Dados invalidos', 400, { chassis: 'Chassi ja cadastrado' }, 'req-1'),
    )
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByText('Chassi ja cadastrado')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('notifica quando a API falha sem erro de campo', async () => {
    vi.mocked(vehiclesApi.create).mockRejectedValue(
      new ApiError('Concessionaria nao encontrada', 404, {}, 'req-2'),
    )
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Concessionaria nao encontrada')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('cancelar volta para a listagem sem enviar nada', async () => {
    renderWithProviders(<VehicleFormPage />)
    await screen.findByLabelText(/^Marca/)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(navigate).toHaveBeenCalledWith('/vehicles')
    expect(vehiclesApi.create).not.toHaveBeenCalled()
  })

  it('em modo de edicao carrega o veiculo e troca a concessionaria', async () => {
    params.current = { id: PULSE.id }
    renderWithProviders(<VehicleFormPage />)

    expect(await screen.findByText('Editar veículo')).toBeInTheDocument()
    await waitFor(() => expect(field.brand()).toHaveValue('Fiat'))
    expect(field.year()).toHaveValue('2025')
    expect(field.chassis()).toHaveValue('9BD11223344000001')
    expect(field.price()).toHaveValue('109.990,00')
    expect(field.dealer()).toHaveValue(BETIM.id)

    await userEvent.selectOptions(field.dealer(), GOIANA.id)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(vehiclesApi.update).toHaveBeenCalledTimes(1))
    expect(vi.mocked(vehiclesApi.update).mock.calls[0][1].dealerId).toBe(GOIANA.id)
    expect(vehiclesApi.create).not.toHaveBeenCalled()
  })

  it('em modo de edicao permite remover o vinculo', async () => {
    params.current = { id: PULSE.id }
    renderWithProviders(<VehicleFormPage />)
    await waitFor(() => expect(field.dealer()).toHaveValue(BETIM.id))

    await userEvent.selectOptions(field.dealer(), '')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(vehiclesApi.update).toHaveBeenCalledTimes(1))
    expect(vi.mocked(vehiclesApi.update).mock.calls[0][1].dealerId).toBeNull()
  })

  it('mostra o erro quando a lista de concessionarias nao carrega', async () => {
    vi.mocked(dealersApi.list).mockRejectedValue(new Error('Servidor fora do ar'))
    renderWithProviders(<VehicleFormPage />)

    expect(await screen.findByText('Não foi possível carregar os dados')).toBeInTheDocument()
    expect(screen.getByText('Servidor fora do ar')).toBeInTheDocument()
  })
})
