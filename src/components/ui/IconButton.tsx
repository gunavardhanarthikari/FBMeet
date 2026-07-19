import type { ButtonHTMLAttributes, ReactNode } from 'react'

type IconButtonVariant = 'default' | 'active' | 'leave'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  variant?: IconButtonVariant
  size?: number
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'bg-surface-card border-border-emphasis text-text-soft',
  active: 'bg-accent border-accent text-text-onaccent shadow-glow-accent',
  leave: 'bg-leave-bg border-leave-border text-leave-icon',
}

export function IconButton({
  icon,
  variant = 'default',
  size = 54,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
}
