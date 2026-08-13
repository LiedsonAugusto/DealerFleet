import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('e do tipo button por padrao para nao submeter formularios sem querer', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('assume o tipo submit quando pedido', () => {
    render(<Button type="submit">Salvar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('bloqueia cliques enquanto carrega', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    )

    const button = screen.getByRole('button', { name: /Salvar/ })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('mostra indicador de carregamento acessivel', () => {
    render(<Button loading>Salvar</Button>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('dispara o clique quando habilitado', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Salvar</Button>)

    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
