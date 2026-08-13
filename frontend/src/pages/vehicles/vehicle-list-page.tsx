import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
import { useDealers } from '@/hooks/use-dealers'
import { useToast } from '@/hooks/use-toast'
import { useDeleteVehicle, useVehicles } from '@/hooks/use-vehicles'
import { errorDetail, errorMessage } from '@/lib/api-errors'
import { empty, formatCurrency } from '@/lib/format'
import { FUEL_LABELS } from '@/lib/labels'
import type { FuelType, Vehicle } from '@/types'

const FUEL_TONES: Record<FuelType, 'neutral' | 'brand' | 'success'> = {
  GASOLINA: 'neutral',
  ETANOL: 'neutral',
  FLEX: 'neutral',
  DIESEL: 'neutral',
  ELETRICO: 'success',
  HIBRIDO: 'brand',
}

export function VehicleListPage() {
  const navigate = useNavigate()
  const { notify } = useToast()

  const [dealerFilter, setDealerFilter] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null)

  const vehicles = useVehicles(dealerFilter === '' ? null : dealerFilter)
  const dealers = useDealers()
  const remove = useDeleteVehicle()

  const dealerNames = useMemo(
    () => new Map((dealers.data ?? []).map((dealer) => [dealer.id, dealer.corporateName])),
    [dealers.data],
  )

  function handleDelete() {
    if (!pendingDelete) {
      return
    }

    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        notify({
          tone: 'success',
          message: `${pendingDelete.brand} ${pendingDelete.model} excluído`,
        })
        setPendingDelete(null)
      },
      onError: (error) => {
        notify({ tone: 'error', message: errorMessage(error), detail: errorDetail(error) })
        setPendingDelete(null)
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Veículos"
        description="Consulte, cadastre e vincule veículos às concessionárias."
        actions={<Button onClick={() => navigate('/vehicles/new')}>Novo veículo</Button>}
      />

      <div className="mb-4 flex flex-col gap-2 sm:max-w-xs">
        <label htmlFor="dealer-filter" className="text-sm font-medium text-slate-700">
          Filtrar por concessionária
        </label>
        <Select
          id="dealer-filter"
          value={dealerFilter}
          onChange={(event) => setDealerFilter(event.target.value)}
          disabled={dealers.isPending}
        >
          <option value="">Todas as concessionárias</option>
          {(dealers.data ?? []).map((dealer) => (
            <option key={dealer.id} value={dealer.id}>
              {dealer.corporateName}
            </option>
          ))}
        </Select>
      </div>

      <QueryState
        isPending={vehicles.isPending}
        error={vehicles.error}
        onRetry={() => void vehicles.refetch()}
      >
        {(vehicles.data ?? []).length === 0 ? (
          <EmptyState
            title="Nenhum veículo encontrado"
            description={
              dealerFilter === ''
                ? 'Cadastre o primeiro veículo da frota para começar.'
                : 'Esta concessionária ainda não possui veículos vinculados.'
            }
            action={<Button onClick={() => navigate('/vehicles/new')}>Cadastrar veículo</Button>}
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
                <TableHeader>Concessionária</TableHeader>
                <TableHeader className="text-right">Ações</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {(vehicles.data ?? []).map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{vehicle.brand}</div>
                    <div className="text-xs text-slate-500">{vehicle.model}</div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={FUEL_TONES[vehicle.fuelType]}>
                      {FUEL_LABELS[vehicle.fuelType]}
                    </Badge>
                  </TableCell>
                  <TableCell>{vehicle.color}</TableCell>
                  <TableCell>{empty(vehicle.year)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(vehicle.price)}
                  </TableCell>
                  <TableCell>
                    {vehicle.dealerId ? (
                      <Link
                        to={`/dealers/${vehicle.dealerId}`}
                        className="text-brand-700 hover:underline"
                      >
                        {dealerNames.get(vehicle.dealerId) ?? 'Concessionária'}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Sem vínculo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setPendingDelete(vehicle)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir veículo"
        description={
          <>
            Esta ação não pode ser desfeita. O veículo{' '}
            <strong className="font-semibold text-slate-900">
              {pendingDelete?.brand} {pendingDelete?.model}
            </strong>{' '}
            será removido permanentemente.
          </>
        }
        loading={remove.isPending}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
