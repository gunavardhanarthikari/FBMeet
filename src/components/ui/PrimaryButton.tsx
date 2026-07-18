import type { ButtonHTMLAttributes } from 'react'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function PrimaryButton({ className = '', children, ...props }: PrimaryButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2.5 rounded-sm border border-accent bg-accent px-6 py-[11px] font-mono text-xs tracking-[0.04em] text-text-onaccent uppercase shadow-glow-accent transition-colors duration-300 ease-out-soft hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
