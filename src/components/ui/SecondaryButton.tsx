import type { ButtonHTMLAttributes } from 'react'

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function SecondaryButton({ className = '', children, ...props }: SecondaryButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2.5 rounded-sm border border-border-emphasis bg-transparent px-6 py-[11px] font-mono text-xs tracking-[0.04em] text-text-soft uppercase transition-colors duration-300 ease-out-soft hover:bg-wash-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
