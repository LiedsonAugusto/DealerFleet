import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const DEBOUNCE = 300

const baseClasses = [
  'w-full min-w-0 rounded border border-transparent bg-slate-50 px-2 py-1 text-xs text-slate-700',
  'placeholder:text-slate-400',
  'hover:border-slate-300 hover:bg-white',
  'focus:border-brand-400 focus:bg-white focus:outline-2 focus:outline-offset-0 focus:outline-brand-500',
].join(' ')

type TextFilterProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  align?: 'left' | 'right'
}

export function TextFilter({ value, onChange, placeholder = 'Filtrar', align }: TextFilterProps) {
  const [local, setLocal] = useState(value)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => setLocal(value), [value])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function handleChange(next: string) {
    setLocal(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onChange(next), DEBOUNCE)
  }

  return (
    <input
      type="text"
      value={local}
      onChange={(event) => handleChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={cn(baseClasses, align === 'right' && 'text-right')}
    />
  )
}

type Option = {
  value: string
  label: string
}

type SelectFilterProps = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  label: string
  placeholder?: string
}

export function SelectFilter({
  value,
  onChange,
  options,
  label,
  placeholder = 'Todos',
}: SelectFilterProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className={cn(baseClasses, 'cursor-pointer')}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
