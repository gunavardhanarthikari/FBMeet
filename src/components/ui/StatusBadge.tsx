import type { ReactNode } from 'react'

interface StatusBadgeProps {
  children: ReactNode
  dot?: boolean
  pulse?: boolean
  icon?: ReactNode
  variant?: 'label' | 'pill'
  className?: string
}

export function StatusBadge({
  children,
  dot = false,
  pulse = false,
  icon,
  variant = 'label',
  className = '',
}: StatusBadgeProps) {
  const base = 'inline-flex items-center gap-1.5 font-mono text-xs tracking-[0.1em] uppercase'
  const variantStyles =
    variant === 'pill'
      ? 'rounded-sm bg-white/90 px-2.5 py-1 text-text-body'
      : 'text-text-title'

  return (
    <span className={`${base} ${variantStyles} ${className}`}>
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_0_var(--color-accent)] ${
            pulse ? 'animate-mood-pulse' : ''
          }`}
        />
      )}
      {icon}
      {children}
    </span>
  )
}
