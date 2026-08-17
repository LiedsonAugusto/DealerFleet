import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { QueryState } from '@/components/query-state'
import { Pagination } from '@/components/table/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Select } from '@/components/ui/select'
import { TableSkeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDealer, useDealerVehicles } from '@/hooks/use-dealers'
import { useTableParams } from '@/hooks/use-table-params'
import { useToast } from '@/hooks/use-toast'
import { useAssignDealer, useUnassignDealer, useUnassignedVehicles } from '@/hooks/use-vehicles'
import { errorMessage } from '@/lib/api-errors'
import { empty, formatCompactCurrency, formatCurrency } from '@/lib/format'
import { FUEL_LABELS } from '@/lib/labels'
import { pageCount, pageSlice } from '@/lib/table'

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
  const unassignedVehicles = useUnassignedVehicles()
  const assign = useAssignDealer()
  const unassign = useUnassignDealer()

  const { page, size, setPage, setSize } = useTableParams({ defaultSize: 10 })

  const available = useMemo(
    () => unassignedVehicles.data?.content ?? [],
    [unassignedVehicles.data],
  )

  const linked = useMemo(() => dealerVehicles.data ?? [], [dealerVehicles.data])

  const totalPages = pageCount(linked.length, size)
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(() => pageSlice(linked, currentPage, size), [linked, currentPage, size])

  const totalValue = useMemo(
    () => linked.reduce((total, vehicle) => total + (vehicle.price ?? 0), 0),
    [linked],
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
          notify({ tone: 'error', message: errorMessage(error) })
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
        notify({ tone: 'error', message: errorMessage(error) })
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
                    <Icon name="arrowLeft" />
                    Voltar
                  </Button>
                  <Button onClick={() => navigate(`/dealers/${data.id}/edit`)}>
                    <Icon name="pencil" />
                    Editar
                  </Button>
                </>
              }
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Veículos vinculados"
                value={String(linked.length)}
                icon="truck"
                tone="brand"
                loading={dealerVehicles.isPending}
              />
              <StatCard
                label="Valor em estoque"
                value={formatCompactCurrency(totalValue)}
                hint={formatCurrency(totalValue)}
                icon="wallet"
                tone="emerald"
                loading={dealerVehicles.isPending}
              />
              <StatCard
                label="Localização"
                value={`${data.address.city} / ${data.address.state}`}
                hint={data.address.neighborhood}
                icon="mapPin"
                tone="slate"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Endereço
              </h2>
              <dl className="mt-4 grid gap-5 sm:grid-cols-3">
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
            </div>
          </>
        )}
      </QueryState>

      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Veículos vinculados
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {linked.length} veículo(s) nesta concessionária.
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
                className="cursor-pointer sm:w-64"
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
              <Icon name="link" />
              Vincular
            </Button>
          </div>
        </div>

        <QueryState
          isPending={dealerVehicles.isPending}
          error={dealerVehicles.error}
          onRetry={() => void dealerVehicles.refetch()}
          skeleton={<TableSkeleton columns={5} rows={4} />}
        >
          {linked.length === 0 ? (
            <EmptyState
              title="Nenhum veículo vinculado"
              description="Use o seletor acima para vincular um veículo sem concessionária."
            />
          ) : (
            <>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeader>Marca / Modelo</TableHeader>
                    <TableHeader>Combustível</TableHeader>
                    <TableHeader>Cor</TableHeader>
                    <TableHeader>Ano</TableHeader>
                    <TableHeader className="text-right">Valor</TableHeader>
                    <TableHeader className="text-right">Ações</TableHeader>
                  </tr>
                </TableHead>
                <TableBody>
                  {paged.map((vehicle) => (
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
                      <TableCell className="tabular-nums">{empty(vehicle.year)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-slate-900">
                        {formatCurrency(vehicle.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Desvincular da concessionária"
                          onClick={() => handleUnassign(vehicle.id)}
                          disabled={unassign.isPending}
                        >
                          <Icon name="unlink" />
                          Desvincular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                page={currentPage}
                size={size}
                total={linked.length}
                onPageChange={setPage}
                onSizeChange={setSize}
              />
            </>
          )}
        </QueryState>
      </div>
    </>
  )
}
