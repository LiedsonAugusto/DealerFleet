import type { ReactNode } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { errorDetail, errorMessage } from '@/lib/api-errors'

type QueryStateProps = {
  isPending: boolean
  error: unknown
  onRetry?: () => void
  children: ReactNode
}

export function QueryState({ isPending, error, onRetry, children }: QueryStateProps) {
  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-16 text-sm text-slate-500">
        <Spinner className="text-brand-600" />
        Carregando...
      </div>
    )
  }

  if (error) {
    const detail = errorDetail(error)

    return (
      <Alert title="Não foi possível carregar os dados">
        <p>{errorMessage(error)}</p>
        {detail && <p className="mt-1 text-xs opacity-75">{detail}</p>}
        {onRetry && (
          <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </Alert>
    )
  }

  return children
}
