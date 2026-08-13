import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { QueryState } from '@/components/query-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDealers, useDeleteDealer } from '@/hooks/use-dealers'
import { useToast } from '@/hooks/use-toast'
import { useVehicles } from '@/hooks/use-vehicles'
import { errorDetail, errorMessage } from '@/lib/api-errors'
import type { Dealer } from '@/types'

export function DealerListPage() {
  const navigate = useNavigate()
  const { notify } = useToast()

  const [pendingDelete, setPendingDelete] = useState<Dealer | null>(null)

  const dealers = useDealers()
  const vehicles = useVehicles()
  const remove = useDeleteDealer()

  const vehicleCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const vehicle of vehicles.data ?? []) {
      if (vehicle.dealerId) {
        counts.set(vehicle.dealerId, (counts.get(vehicle.dealerId) ?? 0) + 1)
      }
    }
    return counts
  }, [vehicles.data])

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
        notify({ tone: 'error', message: errorMessage(error), detail: errorDetail(error) })
        setPendingDelete(null)
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Concessionárias"
        description="Rede de concessionárias parceiras e seus endereços."
        actions={<Button onClick={() => navigate('/dealers/new')}>Nova concessionária</Button>}
      />

      <QueryState
        isPending={dealers.isPending}
        error={dealers.error}
        onRetry={() => void dealers.refetch()}
      >
        {(dealers.data ?? []).length === 0 ? (
          <EmptyState
            title="Nenhuma concessionária cadastrada"
            description="Cadastre a primeira concessionária para começar a vincular veículos."
            action={
              <Button onClick={() => navigate('/dealers/new')}>Cadastrar concessionária</Button>
            }
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Razão social</TableHeader>
                <TableHeader>CNPJ</TableHeader>
                <TableHeader>Cidade / UF</TableHeader>
                <TableHeader>Veículos</TableHeader>
                <TableHeader className="text-right">Ações</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {(dealers.data ?? []).map((dealer) => (
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
                  <TableCell>
                    {dealer.address.city} / {dealer.address.state}
                  </TableCell>
                  <TableCell>
                    <Badge tone={vehicleCounts.get(dealer.id) ? 'brand' : 'neutral'}>
                      {vehicleCounts.get(dealer.id) ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dealers/${dealer.id}/edit`)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setPendingDelete(dealer)}
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
