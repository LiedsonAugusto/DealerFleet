import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { QueryState } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDealer, useDealerVehicles } from '@/hooks/use-dealers'
import { useToast } from '@/hooks/use-toast'
import { useAssignDealer, useUnassignDealer, useVehicles } from '@/hooks/use-vehicles'
import { errorDetail, errorMessage } from '@/lib/api-errors'
import { empty, formatCurrency } from '@/lib/format'
import { FUEL_LABELS } from '@/lib/labels'

type InfoProps = {
  label: string
  value: string
}

function Info({ label, value }: InfoProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  )
}

export function DealerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const [selectedVehicle, setSelectedVehicle] = useState('')

  const dealer = useDealer(id)
  const dealerVehicles = useDealerVehicles(id)
  const allVehicles = useVehicles()
  const assign = useAssignDealer()
  const unassign = useUnassignDealer()

  const available = useMemo(
    () => (allVehicles.data ?? []).filter((vehicle) => vehicle.dealerId === null),
    [allVehicles.data],
  )

  const data = dealer.data

  function handleAssign() {
    if (selectedVehicle === '' || !id) {
      return
    }

    assign.mutate(
      { id: selectedVehicle, dealerId: id },
      {
        onSuccess: (vehicle) => {
          notify({ tone: 'success', message: `${vehicle.brand} ${vehicle.model} vinculado` })
          setSelectedVehicle('')
        },
        onError: (error) => {
          notify({ tone: 'error', message: errorMessage(error), detail: errorDetail(error) })
        },
      },
    )
  }

  function handleUnassign(vehicleId: string) {
    unassign.mutate(vehicleId, {
      onSuccess: (vehicle) => {
        notify({ tone: 'success', message: `${vehicle.brand} ${vehicle.model} desvinculado` })
      },
      onError: (error) => {
        notify({ tone: 'error', message: errorMessage(error), detail: errorDetail(error) })
      },
    })
  }

  return (
    <>
      <QueryState
        isPending={dealer.isPending}
        error={dealer.error}
        onRetry={() => void dealer.refetch()}
      >
        {data && (
          <>
            <PageHeader
              title={data.corporateName}
              description={`CNPJ ${data.cnpjFormatted}`}
              actions={
                <>
                  <Button variant="secondary" onClick={() => navigate('/dealers')}>
                    Voltar
                  </Button>
                  <Button onClick={() => navigate(`/dealers/${data.id}/edit`)}>Editar</Button>
                </>
              }
            />

            <dl className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3">
              <Info label="CEP" value={data.address.cepFormatted} />
              <Info
                label="Logradouro"
                value={
                  data.address.number
                    ? `${data.address.street}, ${data.address.number}`
                    : data.address.street
                }
              />
              <Info label="Complemento" value={empty(data.address.complement)} />
              <Info label="Bairro" value={data.address.neighborhood} />
              <Info label="Cidade" value={data.address.city} />
              <Info label="Estado" value={data.address.state} />
            </dl>
          </>
        )}
      </QueryState>

      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Veículos vinculados</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {(dealerVehicles.data ?? []).length} veículo(s) nesta concessionária.
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="assign-vehicle" className="text-sm font-medium text-slate-700">
                Vincular veículo
              </label>
              <Select
                id="assign-vehicle"
                value={selectedVehicle}
                onChange={(event) => setSelectedVehicle(event.target.value)}
                disabled={available.length === 0}
                className="sm:w-64"
              >
                <option value="">
                  {available.length === 0 ? 'Nenhum veículo disponível' : 'Selecione um veículo'}
                </option>
                {available.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              onClick={handleAssign}
              disabled={selectedVehicle === ''}
              loading={assign.isPending}
            >
              Vincular
            </Button>
          </div>
        </div>

        <QueryState
          isPending={dealerVehicles.isPending}
          error={dealerVehicles.error}
          onRetry={() => void dealerVehicles.refetch()}
        >
          {(dealerVehicles.data ?? []).length === 0 ? (
            <EmptyState
              title="Nenhum veículo vinculado"
              description="Use o seletor acima para vincular um veículo sem concessionária."
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Marca / Modelo</TableHeader>
                  <TableHeader>Combustível</TableHeader>
                  <TableHeader>Cor</TableHeader>
                  <TableHeader>Ano</TableHeader>
                  <TableHeader className="text-right">Valor</TableHeader>
                  <TableHeader className="text-right">Ações</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {(dealerVehicles.data ?? []).map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <Link
                        to={`/vehicles/${vehicle.id}/edit`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {vehicle.brand}
                      </Link>
                      <div className="text-xs text-slate-500">{vehicle.model}</div>
                    </TableCell>
                    <TableCell>
                      <Badge>{FUEL_LABELS[vehicle.fuelType]}</Badge>
                    </TableCell>
                    <TableCell>{vehicle.color}</TableCell>
                    <TableCell>{empty(vehicle.year)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(vehicle.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnassign(vehicle.id)}
                        disabled={unassign.isPending}
                      >
                        Desvincular
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </QueryState>
      </div>
    </>
  )
}
