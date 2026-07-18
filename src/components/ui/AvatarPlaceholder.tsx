interface AvatarPlaceholderProps {
  name: string
  size?: number
  className?: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0]
  return initials.toUpperCase()
}

export function AvatarPlaceholder({ name, size = 64, className = '' }: AvatarPlaceholderProps) {
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`flex items-center justify-center rounded-full border border-border-accent font-display text-text-title ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}
