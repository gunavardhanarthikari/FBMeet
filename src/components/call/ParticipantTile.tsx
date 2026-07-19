import { memo, useEffect, useRef } from 'react'
import type { Participant } from '@/types'
import { AvatarPlaceholder } from '@/components/ui/AvatarPlaceholder'
import { GradientBackground } from '@/components/ui/GradientBackground'
import { MicOffIcon, MicIcon, ScreenShareIcon, XIcon } from '@/components/ui/icons'

interface ParticipantTileProps {
  participant: Participant
  isHostView?: boolean
  onToggleMute?: (id: string) => void
  onRemove?: (id: string) => void
  /** 'grid' (default): equal-weight tile in the participant grid, fixed to a
   *  16:9 aspect ratio. 'stage': fills its parent (used for the single
   *  spotlighted remote when nobody else needs a grid). 'floating': the
   *  small self-preview tile overlaid on top of the call. */
  variant?: 'grid' | 'stage' | 'floating'
  /** True while this participant is the loudest active remote speaker. */
  isSpeaking?: boolean
}

function ParticipantTileComponent({
  participant,
  isHostView = false,
  onToggleMute,
  onRemove,
  variant = 'grid',
  isSpeaking = false,
}: ParticipantTileProps) {
  const {
    name,
    isSelf,
    micMuted,
    cameraOff,
    seedColor,
    videoStream,
    isPresenting,
    connectionQuality,
  } = participant
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasVideo = !cameraOff && !!videoStream
  const connectionIssue =
    connectionQuality === 'poor' || connectionQuality === 'lost' ? connectionQuality : null

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoStream) return
    if (video.srcObject !== videoStream) {
      video.srcObject = videoStream
    }
    video.play().catch(() => {})
  }, [videoStream, hasVideo])

  // 'stage' fills a parent that already has a definite height (a flex-1
  // stage container), so it can be h-full/w-full directly. 'grid' and
  // 'floating' sit inside containers that only constrain width (a grid
  // column or the floating wrapper's width classes), so they need their own
  // aspect-video to get a height at all.
  const sizingClass = variant === 'stage' ? 'h-full w-full' : 'aspect-video w-full min-w-0'
  const highlighted = isPresenting || isSpeaking

  return (
    <div
      className={`relative overflow-hidden rounded-md border bg-surface-sunken ${sizingClass} ${
        variant === 'floating' ? 'shadow-lg' : 'shadow-sm'
      } ${highlighted ? 'border-accent' : 'border-border-default'}`}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          // object-contain (not cover): shows the camera's full, natural
          // frame with no cropping — matching the device's own camera
          // preview — regardless of whether the stream is portrait,
          // landscape, or an unusual sensor ratio.
          className={`h-full w-full object-contain ${isSelf ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <GradientBackground seedColor={seedColor} className={cameraOff ? '' : 'opacity-90'}>
          <AvatarPlaceholder name={name} size={64} />
        </GradientBackground>
      )}

      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-1.5 rounded-sm bg-white/90 px-2.5 py-1 font-mono text-xs tracking-[0.08em] text-text-body">
        {micMuted ? (
          <MicOffIcon className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <MicIcon className="h-3.5 w-3.5 shrink-0" />
        )}
        {isPresenting && <ScreenShareIcon className="h-3.5 w-3.5 shrink-0 text-accent" />}
        <span className="truncate">
          {name}
          {isSelf ? ' (you)' : ''}
        </span>
        {connectionIssue && (
          <span
            role="img"
            aria-label={connectionIssue === 'lost' ? 'Connection lost' : 'Poor connection'}
            title={connectionIssue === 'lost' ? 'Connection lost' : 'Poor connection'}
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-leave-border"
          />
        )}
      </div>

      {isHostView && !isSelf && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleMute?.(participant.id)}
            aria-label={micMuted ? `Unmute ${name}` : `Mute ${name}`}
            aria-pressed={micMuted}
            className={`flex h-7 w-7 items-center justify-center rounded-md border border-border-emphasis text-text-body focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              micMuted ? 'bg-accent text-text-onaccent' : 'bg-white/92'
            }`}
          >
            {micMuted ? <MicOffIcon className="h-3.5 w-3.5" /> : <MicIcon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onRemove?.(participant.id)}
            aria-label={`Remove ${name}`}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-emphasis bg-white/92 text-text-body focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export const ParticipantTile = memo(ParticipantTileComponent)
