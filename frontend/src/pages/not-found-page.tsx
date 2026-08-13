import { useNavigate } from 'react-router'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço acessado não existe ou foi movido."
      action={<Button onClick={() => navigate('/vehicles')}>Ir para veículos</Button>}
    />
  )
}
