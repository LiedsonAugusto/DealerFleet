import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError, addressApi, dealersApi } from '@/api'
import { DealerFormPage } from '@/pages/dealers/dealer-form-page'
import { renderWithProviders } from '@/test/render'
import type { AddressLookup, Dealer } from '@/types'

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
    dealersApi: { ...actual.dealersApi, get: vi.fn(), create: vi.fn(), update: vi.fn() },
    addressApi: { ...actual.addressApi, lookupCep: vi.fn() },
  }
})

const LOOKUP: AddressLookup = {
  cep: '58400500',
  cepFormatted: '58400-500',
  street: 'Rua Jose de Alencar',
  neighborhood: 'Prata',
  city: 'Campina Grande',
  state: 'PB',
}

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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((success, failure) => {
    resolve = success
    reject = failure
  })
  return { promise, resolve, reject }
}

const field = {
  corporateName: () => screen.getByLabelText(/^Razão social/),
  cnpj: () => screen.getByLabelText(/^CNPJ/),
  cep: () => screen.getByLabelText(/^CEP/),
  street: () => screen.getByLabelText(/^Logradouro/),
  number: () => screen.getByLabelText(/^Número/),
  neighborhood: () => screen.getByLabelText(/^Bairro/),
  city: () => screen.getByLabelText(/^Cidade/),
  state: () => screen.getByLabelText(/^UF/),
}

async function fillIdentification() {
  await userEvent.type(field.corporateName(), 'Concessionaria Centro LTDA')
  await userEvent.type(field.cnpj(), '11222333000181')
}

async function fillAddressByCep() {
  await userEvent.type(field.cep(), '58400500')
  await waitFor(() => expect(field.city()).toHaveValue('Campina Grande'))
}

describe('DealerFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    params.current = {}
    vi.mocked(addressApi.lookupCep).mockResolvedValue(LOOKUP)
    vi.mocked(dealersApi.create).mockResolvedValue(BETIM)
    vi.mocked(dealersApi.update).mockResolvedValue(BETIM)
    vi.mocked(dealersApi.get).mockResolvedValue(BETIM)
  })

  it('preenche o endereco automaticamente ao completar o CEP', async () => {
    renderWithProviders(<DealerFormPage />)

    await userEvent.type(field.cep(), '58400500')

    await waitFor(() => expect(field.city()).toHaveValue('Campina Grande'))
    expect(addressApi.lookupCep).toHaveBeenCalledWith('58400500')
    expect(field.street()).toHaveValue('Rua Jose de Alencar')
    expect(field.neighborhood()).toHaveValue('Prata')
    expect(field.state()).toHaveValue('PB')
  })

  it('leva o foco para o numero apos preencher o endereco', async () => {
    renderWithProviders(<DealerFormPage />)

    await userEvent.type(field.cep(), '58400500')

    await waitFor(() => expect(field.number()).toHaveFocus())
  })

  it('nao consulta o ViaCEP enquanto o CEP esta incompleto', async () => {
    renderWithProviders(<DealerFormPage />)

    await userEvent.type(field.cep(), '58400')

    expect(addressApi.lookupCep).not.toHaveBeenCalled()
  })

  it('nao repete a consulta do mesmo CEP', async () => {
    renderWithProviders(<DealerFormPage />)

    await userEvent.type(field.cep(), '58400500')
    await waitFor(() => expect(field.city()).toHaveValue('Campina Grande'))

    await userEvent.type(field.cep(), '{backspace}0')

    await waitFor(() => expect(addressApi.lookupCep).toHaveBeenCalledTimes(1))
  })

  it('o botao Buscar forca nova consulta do mesmo CEP', async () => {
    renderWithProviders(<DealerFormPage />)

    await userEvent.type(field.cep(), '58400500')
    await waitFor(() => expect(field.city()).toHaveValue('Campina Grande'))

    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => expect(addressApi.lookupCep).toHaveBeenCalledTimes(2))
  })

  it('mostra o indicador enquanto consulta o ViaCEP', async () => {
    const pending = deferred<AddressLookup>()
    vi.mocked(addressApi.lookupCep).mockReturnValue(pending.promise)
    renderWithProviders(<DealerFormPage />)

    await userEvent.type(field.cep(), '58400500')

    expect(await screen.findByText('Consultando ViaCEP...')).toBeInTheDocument()

    pending.resolve(LOOKUP)

    await waitFor(() => expect(screen.queryByText('Consultando ViaCEP...')).not.toBeInTheDocument())
  })

  it('avisa para preencher manualmente quando o ViaCEP falha', async () => {
    vi.mocked(addressApi.lookupCep).mockRejectedValue(
      new ApiError('Servico de consulta de CEP indisponivel', 503, {}, 'req-1'),
    )
    renderWithProviders(<DealerFormPage />)

    await userEvent.type(field.cep(), '58400500')

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Servico de consulta de CEP indisponivel')
    expect(alerta).toHaveTextContent('Preencha o endereço manualmente')
    expect(field.city()).toHaveValue('')
  })

  it('preserva o logradouro digitado quando o ViaCEP nao devolve um', async () => {
    vi.mocked(addressApi.lookupCep).mockResolvedValue({ ...LOOKUP, street: null })
    renderWithProviders(<DealerFormPage />)

    await userEvent.type(field.street(), 'Rua informada na mao')
    await userEvent.type(field.cep(), '58400500')

    await waitFor(() => expect(field.city()).toHaveValue('Campina Grande'))
    expect(field.street()).toHaveValue('Rua informada na mao')
  })

  it('barra CNPJ invalido no cliente sem chamar a API', async () => {
    renderWithProviders(<DealerFormPage />)

    await userEvent.type(field.corporateName(), 'Concessionaria Centro LTDA')
    await userEvent.type(field.cnpj(), '11222333000191')
    await fillAddressByCep()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar concessionária' }))

    expect(await screen.findByText('CNPJ inválido')).toBeInTheDocument()
    expect(dealersApi.create).not.toHaveBeenCalled()
  })

  it('exige os campos obrigatorios antes de enviar', async () => {
    renderWithProviders(<DealerFormPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar concessionária' }))

    expect(await screen.findByText('Razão social é obrigatória')).toBeInTheDocument()
    expect(screen.getByText('CNPJ é obrigatório')).toBeInTheDocument()
    expect(screen.getByText('CEP é obrigatório')).toBeInTheDocument()
    expect(dealersApi.create).not.toHaveBeenCalled()
  })

  it('envia CNPJ e CEP sem mascara ao cadastrar', async () => {
    renderWithProviders(<DealerFormPage />)

    await fillIdentification()
    await userEvent.type(field.cep(), '58400500')
    await waitFor(() => expect(field.city()).toHaveValue('Campina Grande'))
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar concessionária' }))

    await waitFor(() => expect(dealersApi.create).toHaveBeenCalledTimes(1))
    expect(dealersApi.create).toHaveBeenCalledWith({
      corporateName: 'Concessionaria Centro LTDA',
      cnpj: '11222333000181',
      address: {
        cep: '58400500',
        street: 'Rua Jose de Alencar',
        number: null,
        complement: null,
        neighborhood: 'Prata',
        city: 'Campina Grande',
        state: 'PB',
      },
    })
  })

  it('notifica e volta para a listagem apos cadastrar', async () => {
    renderWithProviders(<DealerFormPage />)

    await fillIdentification()
    await fillAddressByCep()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar concessionária' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Stellantis Betim Veículos cadastrada',
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dealers'))
  })

  it('mostra no campo o erro devolvido pela API', async () => {
    vi.mocked(dealersApi.create).mockRejectedValue(
      new ApiError('Dados invalidos', 400, { corporateName: 'Razao social ja utilizada' }, 'req-2'),
    )
    renderWithProviders(<DealerFormPage />)

    await fillIdentification()
    await fillAddressByCep()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar concessionária' }))

    expect(await screen.findByText('Razao social ja utilizada')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('notifica sem travar quando a API falha sem erro de campo', async () => {
    vi.mocked(dealersApi.create).mockRejectedValue(
      new ApiError('CNPJ ja cadastrado: 11.222.333/0001-81', 409, {}, 'req-3'),
    )
    renderWithProviders(<DealerFormPage />)

    await fillIdentification()
    await fillAddressByCep()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar concessionária' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'CNPJ ja cadastrado: 11.222.333/0001-81',
    )
    expect(navigate).not.toHaveBeenCalled()
  })

  it('cancelar volta para a listagem sem enviar nada', async () => {
    renderWithProviders(<DealerFormPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(navigate).toHaveBeenCalledWith('/dealers')
    expect(dealersApi.create).not.toHaveBeenCalled()
  })

  it('em modo de edicao carrega a concessionaria e envia a atualizacao', async () => {
    params.current = { id: BETIM.id }
    renderWithProviders(<DealerFormPage />)

    expect(await screen.findByText('Editar concessionária')).toBeInTheDocument()
    await waitFor(() => expect(field.corporateName()).toHaveValue('Stellantis Betim Veículos'))
    expect(field.cnpj()).toHaveValue('11.222.333/0001-81')
    expect(field.cep()).toHaveValue('32669-900')
    expect(field.city()).toHaveValue('Betim')

    await userEvent.clear(field.corporateName())
    await userEvent.type(field.corporateName(), 'Stellantis Betim Matriz')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(dealersApi.update).toHaveBeenCalledTimes(1))
    expect(vi.mocked(dealersApi.update).mock.calls[0][1].corporateName).toBe(
      'Stellantis Betim Matriz',
    )
    expect(dealersApi.create).not.toHaveBeenCalled()
  })

  it('em modo de edicao mostra o erro quando a concessionaria nao carrega', async () => {
    params.current = { id: 'inexistente' }
    vi.mocked(dealersApi.get).mockRejectedValue(new Error('Concessionaria nao encontrada'))
    renderWithProviders(<DealerFormPage />)

    expect(await screen.findByText('Não foi possível carregar os dados')).toBeInTheDocument()
    expect(screen.getByText('Concessionaria nao encontrada')).toBeInTheDocument()
  })
})
