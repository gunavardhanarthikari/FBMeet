import type { HTMLAttributes } from 'react'

type PageContainerProps = HTMLAttributes<HTMLDivElement>

export function PageContainer({ className = '', ...props }: PageContainerProps) {
  return <div className={`mx-auto w-full max-w-5xl px-4 ${className}`} {...props} />
}
