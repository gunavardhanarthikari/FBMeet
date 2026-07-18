import type { InputHTMLAttributes } from 'react'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function InputField({ label, className = '', id, ...props }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono text-xs tracking-[0.22em] text-accent-muted uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        className={`rounded-sm border border-border-emphasis bg-surface-sunken px-3.5 py-[11px] font-body text-base text-text-body shadow-inset-sm outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent ${className}`}
        {...props}
      />
    </div>
  )
}
