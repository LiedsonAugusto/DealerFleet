import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  title?: string
}

export function Logo({ className, title }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn('size-8 shrink-0', className)}
    >
      <rect x="25" y="3" width="14" height="24" rx="5" />
      <rect x="4" y="37" width="14" height="24" rx="5" />
      <rect x="46" y="37" width="14" height="24" rx="5" />
    </svg>
  )
}
