const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function maskCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14)

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8)

  if (digits.length <= 5) {
    return digits
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function maskCurrency(value: string): string {
  const digits = onlyDigits(value).slice(0, 12)

  if (digits === '') {
    return ''
  }

  const cents = Number(digits) / 100
  return cents.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseCurrency(value: string): number | null {
  const digits = onlyDigits(value)

  if (digits === '') {
    return null
  }
  return Number(digits) / 100
}

export function currencyToMask(value: number | null): string {
  if (value === null) {
    return ''
  }
  return maskCurrency(String(Math.round(value * 100)))
}

export function formatCurrency(value: number | null): string {
  if (value === null) {
    return '—'
  }
  return currency.format(value)
}

export function maskChassis(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 17)
}

export function maskYear(value: string): string {
  return onlyDigits(value).slice(0, 4)
}

export function empty(value: string | number | null): string {
  if (value === null || value === '') {
    return '—'
  }
  return String(value)
}
