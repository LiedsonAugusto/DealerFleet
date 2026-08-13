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
import { useDealers } from '@/hooks/use-dealers'
import { useToast } from '@/hooks/use-toast'
import { useCreateVehicle, useUpdateVehicle, useVehicle } from '@/hooks/use-vehicles'
import { applyFieldErrors, errorDetail, errorMessage } from '@/lib/api-errors'
import { maskChassis, maskCurrency, maskYear } from '@/lib/format'
import { FUEL_LABELS } from '@/lib/labels'
import type { VehicleFormValues } from '@/schemas/vehicle'
import { toVehicleFormValues, toVehicleInput, vehicleSchema } from '@/schemas/vehicle'
import type { Dealer, VehicleInput } from '@/types'
import { FUEL_TYPES } from '@/types'

const BLANK: DefaultValues<VehicleFormValues> = {
  brand: '',
  model: '',
  fuelType: undefined,
  color: '',
  year: '',
  chassis: '',
  price: '',
  externalColor: '',
  dealerId: '',
}

type VehicleFormProps = {
  defaultValues: DefaultValues<VehicleFormValues>
  dealers: Dealer[]
  submitting: boolean
  submitLabel: string
  onSubmit: (input: VehicleInput, setError: UseFormSetError<VehicleFormValues>) => void
  onCancel: () => void
}

function VehicleForm({
  defaultValues,
  dealers,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: VehicleFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues,
  })

  const submit = handleSubmit((values) => onSubmit(toVehicleInput(values), setError))

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Dados obrigatórios
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Marca" required error={errors.brand?.message}>
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Fiat"
                {...register('brand')}
              />
            )}
          </Field>

          <Field label="Modelo" required error={errors.model?.message}>
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Pulse Drive 1.3"
                {...register('model')}
              />
            )}
          </Field>

          <Field label="Tipo de combustível" required error={errors.fuelType?.message}>
            {({ id, invalid, describedBy }) => (
              <Select id={id} invalid={invalid} aria-describedby={describedBy} {...register('fuelType')}>
                <option value="">Selecione</option>
                {FUEL_TYPES.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {FUEL_LABELS[fuel]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Cor" required error={errors.color?.message}>
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Vermelho Montecarlo"
                {...register('color')}
              />
            )}
          </Field>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Dados complementares
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Ano" error={errors.year?.message}>
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="year"
                render={({ field }) => (
                  <Input
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    inputMode="numeric"
                    placeholder="2025"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(maskYear(event.target.value))}
                  />
                )}
              />
            )}
          </Field>

          <Field
            label="Chassi"
            error={errors.chassis?.message}
            hint="17 caracteres alfanuméricos"
          >
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="chassis"
                render={({ field }) => (
                  <Input
                    id={id}
                    invalid={invalid}
                    aria-describedby={describedBy}
                    placeholder="9BD11223344000001"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => field.onChange(maskChassis(event.target.value))}
                  />
                )}
              />
            )}
          </Field>

          <Field label="Valor" error={errors.price?.message}>
            {({ id, invalid, describedBy }) => (
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
                      R$
                    </span>
                    <Input
                      id={id}
                      invalid={invalid}
                      aria-describedby={describedBy}
                      inputMode="numeric"
                      className="pl-9 text-right tabular-nums"
                      placeholder="0,00"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(event) => field.onChange(maskCurrency(event.target.value))}
                    />
                  </div>
                )}
              />
            )}
          </Field>

          <Field label="Cor externa" error={errors.externalColor?.message}>
            {({ id, invalid, describedBy }) => (
              <Input
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                placeholder="Preto Vulcano"
                {...register('externalColor')}
              />
            )}
          </Field>

          <Field
            label="Concessionária"
            error={errors.dealerId?.message}
            hint="Opcional. Deixe em branco para manter o veículo sem vínculo."
            className="sm:col-span-2"
          >
            {({ id, invalid, describedBy }) => (
              <Select id={id} invalid={invalid} aria-describedby={describedBy} {...register('dealerId')}>
                <option value="">Sem vínculo</option>
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.corporateName}
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

export function VehicleFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const isEdit = id !== undefined
  const vehicle = useVehicle(id)
  const dealers = useDealers()
  const create = useCreateVehicle()
  const update = useUpdateVehicle(id ?? '')

  const mutation = isEdit ? update : create
  const isPending = dealers.isPending || (isEdit && vehicle.isPending)
  const error = dealers.error ?? (isEdit ? vehicle.error : null)

  function handleSubmit(input: VehicleInput, setError: UseFormSetError<VehicleFormValues>) {
    mutation.mutate(input, {
      onSuccess: (saved) => {
        notify({
          tone: 'success',
          message: isEdit
            ? `${saved.brand} ${saved.model} atualizado`
            : `${saved.brand} ${saved.model} cadastrado`,
        })
        navigate('/vehicles')
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
        title={isEdit ? 'Editar veículo' : 'Novo veículo'}
        description={
          isEdit
            ? 'Atualize os dados do veículo e o vínculo com a concessionária.'
            : 'Preencha os dados do veículo. Campos com * são obrigatórios.'
        }
      />

      <QueryState
        isPending={isPending}
        error={error}
        onRetry={() => {
          void dealers.refetch()
          if (isEdit) {
            void vehicle.refetch()
          }
        }}
      >
        <VehicleForm
          defaultValues={vehicle.data ? toVehicleFormValues(vehicle.data) : BLANK}
          dealers={dealers.data ?? []}
          submitting={mutation.isPending}
          submitLabel={isEdit ? 'Salvar alterações' : 'Cadastrar veículo'}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/vehicles')}
        />
      </QueryState>
    </>
  )
}
