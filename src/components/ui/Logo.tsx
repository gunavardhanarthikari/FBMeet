interface LogoProps {
  size?: 'sm' | 'lg'
  className?: string
}

export function Logo({ size = 'lg', className = '' }: LogoProps) {
  if (size === 'sm') {
    return (
      <span className={`font-display text-xl text-text-title ${className}`}>FBMeet</span>
    )
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <svg
        viewBox="0 0 64 64"
        className="mb-4 h-[clamp(56px,9vw,80px)] w-[clamp(56px,9vw,80px)]"
        fill="none"
        stroke="var(--color-text-title)"
        strokeWidth="1.5"
      >
        <rect x="8" y="16" width="34" height="32" rx="4" />
        <path d="M42 28 56 19v26L42 36" />
      </svg>
      <h1 className="font-display text-5xl leading-[1.08] font-medium text-text-title">
        FBMeet
      </h1>
      <p className="mt-1.5 font-display text-[clamp(20px,3vw,32px)] leading-[1.08] text-text-soft italic">
        — a room for meeting, slowly —
      </p>
    </div>
  )
}
