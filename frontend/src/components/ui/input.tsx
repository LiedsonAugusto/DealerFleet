import type { InputHTMLAttributes } from 'react'
import { borderClasses, controlClasses } from '@/components/ui/control-styles'
import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlClasses, borderClasses(invalid), className)}
      {...props}
    />
  )
}
