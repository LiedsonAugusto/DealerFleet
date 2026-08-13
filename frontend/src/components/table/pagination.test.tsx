import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '@/components/table/pagination'

function setup(overrides: Partial<Parameters<typeof Pagination>[0]> = {}) {
  const onPageChange = vi.fn()
  const onSizeChange = vi.fn()

  render(
    <Pagination
      page={1}
      size={10}
      total={16}
      onPageChange={onPageChange}
      onSizeChange={onSizeChange}
      {...overrides}
    />,
  )

  return { onPageChange, onSizeChange }
}

describe('Pagination', () => {
  it('mostra a faixa de itens da pagina atual', () => {
    setup()
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 1–10 de 16')
  })

  it('mostra a faixa parcial na ultima pagina', () => {
    setup({ page: 2 })
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 11–16 de 16')
  })

  it('avisa quando nao ha resultados', () => {
    setup({ total: 0 })
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument()
  })

  it('desabilita o botao anterior na primeira pagina', () => {
    setup({ page: 1 })
    expect(screen.getByLabelText('Página anterior')).toBeDisabled()
    expect(screen.getByLabelText('Próxima página')).toBeEnabled()
  })

  it('desabilita o botao proximo na ultima pagina', () => {
    setup({ page: 2 })
    expect(screen.getByLabelText('Próxima página')).toBeDisabled()
  })

  it('marca a pagina atual para leitores de tela', () => {
    setup({ page: 2 })
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
  })

  it('avisa a pagina escolhida ao clicar no numero', async () => {
    const { onPageChange } = setup()

    await userEvent.click(screen.getByRole('button', { name: '2' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('avisa a nova quantidade por pagina', async () => {
    const { onSizeChange } = setup()

    await userEvent.selectOptions(screen.getByRole('combobox'), '25')
    expect(onSizeChange).toHaveBeenCalledWith(25)
  })

  it('limita a pagina exibida ao total disponivel', () => {
    setup({ page: 99 })
    expect(screen.getByText(/Mostrando/)).toHaveTextContent('Mostrando 11–16 de 16')
  })
})
