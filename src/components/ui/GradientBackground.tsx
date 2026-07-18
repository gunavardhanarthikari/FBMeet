import type { HTMLAttributes } from 'react'

interface GradientBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  seedColor?: string
}

export function GradientBackground({
  seedColor = '#0d3a37',
  className = '',
  style,
  ...props
}: GradientBackgroundProps) {
  return (
    <div
      style={{
        backgroundImage: `radial-gradient(120% 120% at 50% 35%, ${seedColor}, #ffffff)`,
        ...style,
      }}
      className={`flex h-full w-full items-center justify-center ${className}`}
      {...props}
    />
  )
}
