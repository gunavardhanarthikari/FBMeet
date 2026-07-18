import type { HTMLAttributes } from 'react'

type SectionProps = HTMLAttributes<HTMLElement>

export function Section({ className = '', ...props }: SectionProps) {
  return <section className={`py-8 ${className}`} {...props} />
}
