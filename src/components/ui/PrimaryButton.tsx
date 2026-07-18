import { forwardRef, type ButtonHTMLAttributes } from 'react'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  function PrimaryButton({ className = '', children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2.5 rounded-sm border border-accent bg-accent-muted px-6 py-[11px] font-mono text-xs tracking-[0.04em] text-text-onaccent uppercase shadow-glow-accent transition-colors duration-300 ease-out-soft hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  },
)
