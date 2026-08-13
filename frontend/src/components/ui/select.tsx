import type { SelectHTMLAttributes } from 'react'
import { borderClasses, controlClasses } from '@/components/ui/control-styles'
import { cn } from '@/lib/utils'

const CHEVRON =
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke-width=%221.5%22 stroke=%22%2364748b%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22m19.5 8.25-7.5 7.5-7.5-7.5%22/%3E%3C/svg%3E')]"

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
}

export function Select({ invalid = false, className, children, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        controlClasses,
        'appearance-none bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-9',
        CHEVRON,
        borderClasses(invalid),
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
