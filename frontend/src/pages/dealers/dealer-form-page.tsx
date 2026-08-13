import { useRef } from 'react'
import type { DefaultValues, UseFormSetError } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { QueryState } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useCepLookup } from '@/hooks/use-cep-lookup'
import { useCreateDealer, useDealer, useUpdateDealer } from '@/hooks/use-dealers'
import { useToast } from '@/hooks/use-toast'
import { applyFieldErrors, errorDetail, errorMessage } from '@/lib/api-errors'
import { maskCep, maskCnpj, onlyDigits } from '@/lib/format'
import { BRAZILIAN_STATES } from '@/lib/states'
import type { DealerFormValues } from '@/schemas/dealer'
import { dealerSchema, toDealerFormValues, toDealerInput } from '@/schemas/dealer'
import type { DealerInput } from '@/types'

const BLANK: DefaultValues<DealerFormValues> = {
  corporateName: '',
  cnpj: '',
  address: {
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  },
}

type DealerFormProps = {
  defaultValues: DefaultValues<DealerFormValues>
  submitting: boolean
  submitLabel: string
  onSubmit: (input: DealerInput, setError: UseFormSetError<DealerFormValues>) => void
  onCancel: () => void
}

function DealerForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: DealerFormProps) {
  const { notify } = useToast()
  const lookup = useCepLookup()
  const lastLookup = useRef('')

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setFocus,
    getValues,
    setError,
    formState: { errors },
  } = useForm<DealerFormValues>({
    resolver: zodResolver(dealerSchema),
    defaultValues,
  })

  function fillAddress(cep: string) {
    const digits = onlyDigits(cep)

    if (digits.length !== 8 || digits === lastLookup.current) {
      return
    }
    lastLookup.current = digits

    lookup.mutate(digits, {
      onSuccess: (address) => {
        if (address.street) {
          setValue('address.street', address.street, { shouldValidate: true })
        }
        if (address.neighborhood) {
          setValue('address.neighborhood', address.neighborhood, { shouldValidate: true })
        }
        setValue('address.city', address.city, { shouldValidate: true })
        setValue('address.state', address.state, { shouldValidate: true })
        setFocus('address.number')
      },
      onError: (error) => {
        notify({
          tone: 'error',
          message: errorMessage(error),
          detail: 'Preencha o endereço manualmente',
        })
      },
    })
  }

  const submit = handleSubmit((values) => onSubmit(toDealerInput(values), setError))

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Identificação
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Razão social"
            required
            error={errors.corporateName?.message}
            className="sm:col-span-2"
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Stellantis Betim Veículos"
                {...register('corporateName')}
              />
            )}
          </Field>

          <Field label="CNPJ" required error={errors.cnpj?.message}>
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="cnpj"
                render={({ field }) => (
                  <Input
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    className="tabular-nums"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(maskCnpj(event.target.value))}
                  />
                )}
              />
            )}
          </Field>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Endereço</h2>
          {lookup.isPending && (
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Spinner className="text-brand-600" />
              Consultando ViaCEP...
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-6">
          <Field
            label="CEP"
            required
            error={errors.address?.cep?.message}
            hint="O endereço é preenchido automaticamente"
            className="sm:col-span-2"
          >
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="address.cep"
                render={({ field }) => (
                  <div className="flex gap-2">
                    <Input
                      id={id}
                      invalid={invalid}
                      aria-describedby={describedBy}
                      inputMode="numeric"
                      placeholder="00000-000"
                      className="tabular-nums"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const masked = maskCep(event.target.value)
                        field.onChange(masked)
                        fillAddress(masked)
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="md"
                      className="shrink-0"
                      loading={lookup.isPending}
                      onClick={() => {
                        lastLookup.current = ''
                        fillAddress(getValues('address.cep'))
                      }}
                    >
                      Buscar
                    </Button>
                  </div>
                )}
              />
            )}
          </Field>

          <Field
            label="Logradouro"
            required
            error={errors.address?.street?.message}
            className="sm:col-span-4"
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Avenida Contorno"
                {...register('address.street')}
              />
            )}
          </Field>

          <Field label="Número" error={errors.address?.number?.message} className="sm:col-span-2">
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="3455"
                {...register('address.number')}
              />
            )}
          </Field>

          <Field
            label="Complemento"
            error={errors.address?.complement?.message}
            className="sm:col-span-4"
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Bloco A, sala 12"
                {...register('address.complement')}
              />
            )}
          </Field>

          <Field
            label="Bairro"
            required
            error={errors.address?.neighborhood?.message}
            className="sm:col-span-3"
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Distrito Industrial"
                {...register('address.neighborhood')}
              />
            )}
          </Field>

          <Field
            label="Cidade"
            required
            error={errors.address?.city?.message}
            className="sm:col-span-2"
          >
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Betim"
                {...register('address.city')}
              />
            )}
          </Field>

          <Field label="UF" required error={errors.address?.state?.message}>
            {({ id, invalid, describedBy }) => (
              <Select
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                {...register('address.state')}
              >
                <option value="">--</option>
                {BRAZILIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function DealerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const isEdit = id !== undefined
  const dealer = useDealer(id)
  const create = useCreateDealer()
  const update = useUpdateDealer(id ?? '')

  const mutation = isEdit ? update : create

  function handleSubmit(input: DealerInput, setError: UseFormSetError<DealerFormValues>) {
    mutation.mutate(input, {
      onSuccess: (saved) => {
        notify({
          tone: 'success',
          message: isEdit
            ? `${saved.corporateName} atualizada`
            : `${saved.corporateName} cadastrada`,
        })
        navigate('/dealers')
      },
      onError: (submitError) => {
        const mapped = applyFieldErrors(submitError, setError)
        if (!mapped) {
          notify({
            tone: 'error',
            message: errorMessage(submitError),
            detail: errorDetail(submitError),
          })
        }
      },
    })
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Editar concessionária' : 'Nova concessionária'}
        description={
          isEdit
            ? 'Atualize os dados cadastrais e o endereço da concessionária.'
            : 'Informe o CEP para preencher o endereço automaticamente via ViaCEP.'
        }
      />

      <QueryState
        isPending={isEdit && dealer.isPending}
        error={isEdit ? dealer.error : null}
        onRetry={() => void dealer.refetch()}
      >
        <DealerForm
          defaultValues={dealer.data ? toDealerFormValues(dealer.data) : BLANK}
          submitting={mutation.isPending}
          submitLabel={isEdit ? 'Salvar alterações' : 'Cadastrar concessionária'}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/dealers')}
        />
      </QueryState>
    </>
  )
}
