import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icon'

const DEBOUNCE = 300

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Buscar' }: SearchInputProps) {
  const [local, setLocal] = useState(value)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => setLocal(value), [value])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function push(next: string) {
    setLocal(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onChange(next), DEBOUNCE)
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={local}
        onChange={(event) => push(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-2 focus:outline-offset-0 focus:outline-brand-600"
      />
      {local !== '' && (
        <button
          type="button"
          onClick={() => {
            window.clearTimeout(timer.current)
            setLocal('')
            onChange('')
          }}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Icon name="x" className="size-3.5" />
        </button>
      )}
    </div>
  )
}
