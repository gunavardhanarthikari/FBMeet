import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-500 ${className}`}
      {...props}
    />
  )
}
