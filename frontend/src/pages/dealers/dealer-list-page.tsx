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
import { useDealers, useDeleteDealer } from '@/hooks/use-dealers'
import { useTableParams } from '@/hooks/use-table-params'
import { useToast } from '@/hooks/use-toast'
import { errorMessage } from '@/lib/api-errors'
import { onlyDigits } from '@/lib/format'
import type { CellValue } from '@/lib/table'
import { matchesText, pageCount, pageSlice, sortRows } from '@/lib/table'
import type { Dealer } from '@/types'

function matchesCnpj(dealer: Dealer, filter: string): boolean {
  if (filter.trim() === '') {
    return true
  }

  const digits = onlyDigits(filter)
  if (digits !== '') {
    return dealer.cnpj.includes(digits)
  }
  return matchesText(dealer.cnpjFormatted, filter)
}

export function DealerListPage() {
  const navigate = useNavigate()
  const { notify } = useToast()

  const [pendingDelete, setPendingDelete] = useState<Dealer | null>(null)

  const dealers = useDealers()
  const remove = useDeleteDealer()

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

  const rows = useMemo(() => dealers.data ?? [], [dealers.data])

  const stateOptions = useMemo(() => {
    const states = [...new Set(rows.map((dealer) => dealer.address.state))].sort()
    return states.map((state) => ({ value: state, label: state }))
  }, [rows])

  const accessors = useMemo<Record<string, (dealer: Dealer) => CellValue>>(
    () => ({
      corporateName: (dealer) => dealer.corporateName,
      cnpj: (dealer) => dealer.cnpj,
      city: (dealer) => dealer.address.city,
      state: (dealer) => dealer.address.state,
      vehicles: (dealer) => dealer.vehicleCount,
    }),
    [],
  )

  const filtered = useMemo(() => {
    const search = filters.q ?? ''

    return rows.filter((dealer) => {
      if (
        search !== ''
        && ![dealer.corporateName, dealer.address.city, dealer.address.street].some((field) =>
          matchesText(field, search),
        )
        && !matchesCnpj(dealer, search)
      ) {
        return false
      }

      if (filters.state !== undefined && dealer.address.state !== filters.state) {
        return false
      }

      return (
        matchesText(dealer.corporateName, filters.name ?? '')
        && matchesCnpj(dealer, filters.cnpj ?? '')
        && matchesText(dealer.address.city, filters.city ?? '')
      )
    })
  }, [rows, filters])

  const sorted = useMemo(
    () => sortRows(filtered, sort ? accessors[sort] : undefined, direction),
    [filtered, sort, direction, accessors],
  )

  const totalPages = pageCount(sorted.length, size)
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(() => pageSlice(sorted, currentPage, size), [sorted, currentPage, size])

  const linkedVehicles = useMemo(
    () => rows.reduce((total, dealer) => total + dealer.vehicleCount, 0),
    [rows],
  )
  const statesCovered = useMemo(
    () => new Set(rows.map((dealer) => dealer.address.state)).size,
    [rows],
  )

  function handleDelete() {
    if (!pendingDelete) {
      return
    }

    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        notify({ tone: 'success', message: `${pendingDelete.corporateName} excluída` })
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
        title="Concessionárias"
        description="Rede de concessionárias parceiras e seus endereços."
        actions={
          <Button onClick={() => navigate('/dealers/new')}>
            <Icon name="plus" />
            Nova concessionária
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Concessionárias"
          value={String(rows.length)}
          icon="building"
          tone="brand"
          loading={dealers.isPending}
        />
        <StatCard
          label="Estados atendidos"
          value={String(statesCovered)}
          icon="mapPin"
          tone="slate"
          loading={dealers.isPending}
        />
        <StatCard
          label="Veículos vinculados"
          value={String(linkedVehicles)}
          icon="truck"
          tone="emerald"
          loading={dealers.isPending}
        />
        <StatCard
          label="Média por unidade"
          value={rows.length === 0 ? '0' : (linkedVehicles / rows.length).toFixed(1)}
          hint="Veículos por concessionária"
          icon="wallet"
          tone="slate"
          loading={dealers.isPending}
        />
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={filters.q ?? ''}
          onChange={(value) => setFilter('q', value)}
          placeholder="Buscar razão social, CNPJ ou cidade"
        />

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <Icon name="x" className="size-3.5" />
            Limpar filtros ({activeFilters})
          </Button>
        )}
      </div>

      <QueryState
        isPending={dealers.isPending}
        error={dealers.error}
        onRetry={() => void dealers.refetch()}
        skeleton={<TableSkeleton columns={5} rows={size > 10 ? 10 : size} />}
      >
        {rows.length === 0 ? (
          <EmptyState
            title="Nenhuma concessionária cadastrada"
            description="Cadastre a primeira concessionária para começar a vincular veículos."
            action={
              <Button onClick={() => navigate('/dealers/new')}>Cadastrar concessionária</Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <tr>
                  <SortableHeader
                    label="Razão social"
                    columnKey="corporateName"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="CNPJ"
                    columnKey="cnpj"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Cidade"
                    columnKey="city"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="UF"
                    columnKey="state"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Veículos"
                    columnKey="vehicles"
                    sort={sort}
                    direction={direction}
                    onSort={toggleSort}
                    align="right"
                    className="text-right"
                  />
                  <TableHeader className="text-right">Ações</TableHeader>
                </tr>

                <TableFilterRow>
                  <td>
                    <TextFilter
                      value={filters.name ?? ''}
                      onChange={(value) => setFilter('name', value)}
                      placeholder="Razão social"
                    />
                  </td>
                  <td>
                    <TextFilter
                      value={filters.cnpj ?? ''}
                      onChange={(value) => setFilter('cnpj', value)}
                      placeholder="CNPJ"
                    />
                  </td>
                  <td>
                    <TextFilter
                      value={filters.city ?? ''}
                      onChange={(value) => setFilter('city', value)}
                      placeholder="Cidade"
                    />
                  </td>
                  <td>
                    <SelectFilter
                      label="Filtrar por estado"
                      value={filters.state ?? ''}
                      onChange={(value) => setFilter('state', value)}
                      options={stateOptions}
                    />
                  </td>
                  <td />
                  <td />
                </TableFilterRow>
              </TableHead>

              <TableBody>
                {paged.map((dealer) => (
                  <TableRow key={dealer.id}>
                    <TableCell>
                      <Link
                        to={`/dealers/${dealer.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {dealer.corporateName}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {dealer.address.street}
                        {dealer.address.number ? `, ${dealer.address.number}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{dealer.cnpjFormatted}</TableCell>
                    <TableCell>{dealer.address.city}</TableCell>
                    <TableCell>
                      <Badge>{dealer.address.state}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge tone={dealer.vehicleCount ? 'brand' : 'neutral'}>
                        {dealer.vehicleCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Editar concessionária"
                          onClick={() => navigate(`/dealers/${dealer.id}/edit`)}
                        >
                          <Icon name="pencil" />
                          <span className="sr-only">Editar concessionária</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Excluir concessionária"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setPendingDelete(dealer)}
                        >
                          <Icon name="trash" />
                          <span className="sr-only">Excluir concessionária</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {paged.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-slate-900">
                        Nenhuma concessionária corresponde aos filtros
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
        title="Excluir concessionária"
        description={
          <>
            <strong className="font-semibold text-slate-900">
              {pendingDelete?.corporateName}
            </strong>{' '}
            será removida permanentemente. Concessionárias com veículos vinculados não podem ser
            excluídas.
          </>
        }
        loading={remove.isPending}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
