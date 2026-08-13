import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { QueryState } from '@/components/query-state'
import { SelectFilter, TextFilter } from '@/components/table/column-filter'
import { Pagination } from '@/components/table/pagination'
import { SortableHeader } from '@/components/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { SearchInput } from '@/components/ui/search-input'
import { TableSkeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import {
  Table,
  TableBody,
  TableCell,
  TableFilterRow,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDealers } from '@/hooks/use-dealers'
import { useTableParams } from '@/hooks/use-table-params'
import { useToast } from '@/hooks/use-toast'
import { useDeleteVehicle, useVehicles } from '@/hooks/use-vehicles'
import { errorMessage } from '@/lib/api-errors'
import { empty, formatCompactCurrency, formatCurrency } from '@/lib/format'
import { FUEL_LABELS } from '@/lib/labels'
import type { CellValue } from '@/lib/table'
import { matchesText, pageCount, pageSlice, sortRows } from '@/lib/table'
import type { FuelType, Vehicle } from '@/types'
import { FUEL_TYPES } from '@/types'

const FUEL_TONES: Record<FuelType, 'neutral' | 'brand' | 'success'> = {
  GASOLINA: 'neutral',
  ETANOL: 'neutral',
  FLEX: 'neutral',
  DIESEL: 'neutral',
  ELETRICO: 'success',
  HIBRIDO: 'brand',
}

const FUEL_OPTIONS = FUEL_TYPES.map((fuel) => ({ value: fuel, label: FUEL_LABELS[fuel] }))

const UNASSIGNED = 'none'

export function VehicleListPage() {
  const navigate = useNavigate()
  const { notify } = useToast()

  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null)

  const vehicles = useVehicles()
  const dealers = useDealers()
  const remove = useDeleteVehicle()

  const {
    filters,
    sort,
    direction,
    page,
    size,
    activeFilters,
    setFilter,
    toggleSort,
    setPage,
    setSize,
    clearFilters,
  } = useTableParams({ defaultSize: 10 })

  const rows = useMemo(() => vehicles.data ?? [], [vehicles.data])

  const dealerNames = useMemo(
    () => new Map((dealers.data ?? []).map((dealer) => [dealer.id, dealer.corporateName])),
    [dealers.data],
  )

  const dealerOptions = useMemo(
    () => [
      { value: UNASSIGNED, label: 'Sem vínculo' },
      ...(dealers.data ?? []).map((dealer) => ({
        value: dealer.id,
        label: dealer.corporateName,
      })),
    ],
    [dealers.data],
  )

  const accessors = useMemo<Record<string, (vehicle: Vehicle) => CellValue>>(
    () => ({
      brand: (vehicle) => vehicle.brand,
      model: (vehicle) => vehicle.model,
      fuelType: (vehicle) => FUEL_LABELS[vehicle.fuelType],
      color: (vehicle) => vehicle.color,
      year: (vehicle) => vehicle.year,
      price: (vehicle) => vehicle.price,
      dealer: (vehicle) =>
        vehicle.dealerId === null ? null : (dealerNames.get(vehicle.dealerId) ?? ''),
    }),
    [dealerNames],
  )

  const filtered = useMemo(() => {
    const search = filters.q ?? ''
    const dealerFilter = filters.dealer ?? ''

    return rows.filter((vehicle) => {
      if (
        search !== ''
        && ![vehicle.brand, vehicle.model, vehicle.color, vehicle.chassis].some((field) =>
          matchesText(field, search),
        )
      ) {
        return false
      }

      if (dealerFilter === UNASSIGNED && vehicle.dealerId !== null) {
        return false
      }
      if (dealerFilter !== '' && dealerFilter !== UNASSIGNED && vehicle.dealerId !== dealerFilter) {
        return false
      }
      if (filters.fuel !== undefined && vehicle.fuelType !== filters.fuel) {
        return false
      }

      return (
        matchesText(vehicle.brand, filters.brand ?? '')
        && matchesText(vehicle.model, filters.model ?? '')
        && matchesText(vehicle.color, filters.color ?? '')
        && matchesText(vehicle.year, filters.year ?? '')
      )
    })
  }, [rows, filters])

  const sorted = useMemo(
    () => sortRows(filtered, sort ? accessors[sort] : undefined, direction),
    [filtered, sort, direction, accessors],
  )

  const totalPages = pageCount(sorted.length, size)
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(
    () => pageSlice(sorted, currentPage, size),
    [sorted, currentPage, size],
  )

  const fleetValue = useMemo(
    () => rows.reduce((total, vehicle) => total + (vehicle.price ?? 0), 0),
    [rows],
  )
  const unassigned = useMemo(
    () => rows.filter((vehicle) => vehicle.dealerId === null).length,
    [rows],
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
        notify({ tone: 'error', message: errorMessage(error) })
        setPendingDelete(null)
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Veículos"
        description="Consulte, cadastre e vincule veículos às concessionárias."
        actions={
          <Button onClick={() => navigate('/vehicles/new')}>
            <Icon name="plus" />
            Novo veículo
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Veículos"
          value={String(rows.length)}
          icon="truck"
          tone="brand"
          loading={vehicles.isPending}
        />
        <StatCard
          label="Valor da frota"
          value={formatCompactCurrency(fleetValue)}
          hint={formatCurrency(fleetValue)}
          icon="wallet"
          tone="emerald"
          loading={vehicles.isPending}
        />
        <StatCard
          label="Concessionárias"
          value={String((dealers.data ?? []).length)}
          icon="building"
          tone="slate"
          loading={dealers.isPending}
        />
        <StatCard
          label="Sem vínculo"
          value={String(unassigned)}
          hint={unassigned > 0 ? 'Aguardando concessionária' : 'Toda a frota vinculada'}
          icon="unlink"
          tone={unassigned > 0 ? 'amber' : 'slate'}
          loading={vehicles.isPending}
        />
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={filters.q ?? ''}
          onChange={(value) => setFilter('q', value)}
          placeholder="Buscar marca, modelo, cor ou chassi"
        />

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <Icon name="x" className="size-3.5" />
            Limpar filtros ({activeFilters})
          </Button>
        )}
      </div>

      <QueryState
        isPending={vehicles.isPending}
        error={vehicles.error}
        onRetry={() => void vehicles.refetch()}
        skeleton={<TableSkeleton columns={6} rows={size > 10 ? 10 : size} />}
      >
        {rows.length === 0 ? (
          <EmptyState
            title="Nenhum veículo cadastrado"
            description="Cadastre o primeiro veículo da frota para começar."
            action={<Button onClick={() => navigate('/vehicles/new')}>Cadastrar veículo</Button>}
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <tr>
                  <SortableHeader
                    label="Marca"
                    columnKey="brand"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Modelo"
                    columnKey="model"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Combustível"
                    columnKey="fuelType"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Cor"
                    columnKey="color"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Ano"
                    columnKey="year"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Valor"
                    columnKey="price"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                    align="right"
                    className="text-right"
                  />
                  <SortableHeader
                    label="Concessionária"
                    columnKey="dealer"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <TableHeader className="text-right">Ações</TableHeader>
                </tr>

                <TableFilterRow>
                  <td>
                    <TextFilter
                      value={filters.brand ?? ''}
                      onChange={(value) => setFilter('brand', value)}
                      placeholder="Marca"
                    />
                  </td>
                  <td>
                    <TextFilter
                      value={filters.model ?? ''}
                      onChange={(value) => setFilter('model', value)}
                      placeholder="Modelo"
                    />
                  </td>
                  <td>
                    <SelectFilter
                      value={filters.fuel ?? ''}
                      onChange={(value) => setFilter('fuel', value)}
                      options={FUEL_OPTIONS}
                    />
                  </td>
                  <td>
                    <TextFilter
                      value={filters.color ?? ''}
                      onChange={(value) => setFilter('color', value)}
                      placeholder="Cor"
                    />
                  </td>
                  <td>
                    <TextFilter
                      value={filters.year ?? ''}
                      onChange={(value) => setFilter('year', value)}
                      placeholder="Ano"
                    />
                  </td>
                  <td />
                  <td>
                    <SelectFilter
                      value={filters.dealer ?? ''}
                      onChange={(value) => setFilter('dealer', value)}
                      options={dealerOptions}
                    />
                  </td>
                  <td />
                </TableFilterRow>
              </TableHead>

              <TableBody>
                {paged.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium text-slate-900">{vehicle.brand}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>
                      <Badge tone={FUEL_TONES[vehicle.fuelType]}>
                        {FUEL_LABELS[vehicle.fuelType]}
                      </Badge>
                    </TableCell>
                    <TableCell>{vehicle.color}</TableCell>
                    <TableCell className="tabular-nums">{empty(vehicle.year)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-slate-900">
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
                          title="Editar veículo"
                          onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                        >
                          <Icon name="pencil" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Excluir veículo"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setPendingDelete(vehicle)}
                        >
                          <Icon name="trash" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {paged.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-slate-900">
                        Nenhum veículo corresponde aos filtros
                      </p>
                      <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>
                        Limpar filtros
                      </Button>
                    </td>
                  </tr>
                )}
              </TableBody>
            </Table>

            <Pagination
              page={currentPage}
              size={size}
              total={sorted.length}
              onPageChange={setPage}
              onSizeChange={setSize}
            />
          </>
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
