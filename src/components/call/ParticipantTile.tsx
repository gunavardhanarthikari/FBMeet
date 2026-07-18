import type { Participant } from '@/types'
import { AvatarPlaceholder } from '@/components/ui/AvatarPlaceholder'
import { GradientBackground } from '@/components/ui/GradientBackground'
import { MicOffIcon, MicIcon, XIcon } from '@/components/ui/icons'

interface ParticipantTileProps {
  participant: Participant
  isHostView?: boolean
  onToggleMute?: (id: string) => void
  onRemove?: (id: string) => void
}

export function ParticipantTile({
  participant,
  isHostView = false,
  onToggleMute,
  onRemove,
}: ParticipantTileProps) {
  const { name, isSelf, micMuted, cameraOff, seedColor } = participant

  return (
    <div className="relative aspect-video min-w-0 overflow-hidden rounded-md border border-border-default bg-surface-sunken shadow-sm">
      {cameraOff ? (
        <GradientBackground seedColor={seedColor}>
          <AvatarPlaceholder name={name} size={64} />
        </GradientBackground>
      ) : (
        <GradientBackground seedColor={seedColor} className="opacity-90">
          <AvatarPlaceholder name={name} size={64} />
        </GradientBackground>
      )}

      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-1.5 rounded-sm bg-white/90 px-2.5 py-1 font-mono text-xs tracking-[0.08em] text-text-body">
        {micMuted ? (
          <MicOffIcon className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <MicIcon className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">
          {name}
          {isSelf ? ' (you)' : ''}
        </span>
      </div>

      {isHostView && !isSelf && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleMute?.(participant.id)}
            aria-label="Toggle participant mute"
            className={`flex h-7 w-7 items-center justify-center rounded-md border border-border-emphasis text-text-body ${
              micMuted ? 'bg-accent text-text-onaccent' : 'bg-white/92'
            }`}
          >
            {micMuted ? <MicOffIcon className="h-3.5 w-3.5" /> : <MicIcon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onRemove?.(participant.id)}
            aria-label="Remove participant"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-emphasis bg-white/92 text-text-body"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
