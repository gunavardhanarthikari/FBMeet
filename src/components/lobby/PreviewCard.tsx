import { useEffect, useRef } from 'react'
import { AvatarPlaceholder } from '@/components/ui/AvatarPlaceholder'
import { GradientBackground } from '@/components/ui/GradientBackground'
import { IconButton } from '@/components/ui/IconButton'
import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon } from '@/components/ui/icons'

interface PreviewCardProps {
  name: string
  stream: MediaStream | null
  micOn: boolean
  cameraOn: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
}

export function PreviewCard({
  name,
  stream,
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
}: PreviewCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    if (video.srcObject !== stream) {
      video.srcObject = stream
    }
    video.play().catch(() => {
      // Autoplay can be rejected by some browsers even after a user gesture;
      // the preview simply stays paused rather than throwing.
    })
  }, [stream, cameraOn])

  return (
    <div className="relative aspect-video w-[min(560px,90vw)] overflow-hidden rounded-md border border-border-default bg-surface-sunken shadow-lg">
      {cameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full scale-x-[-1] object-cover"
        />
      ) : (
        <GradientBackground seedColor="#0d3a37" className="flex-col gap-3.5">
          <AvatarPlaceholder name={name || '?'} size={84} />
          <span className="font-mono text-xs tracking-[0.22em] text-text-muted uppercase">
            Camera is off
          </span>
        </GradientBackground>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3.5 bg-gradient-to-t from-black/40 to-transparent p-4">
        <IconButton
          icon={micOn ? <MicIcon className="h-5.5 w-5.5" /> : <MicOffIcon className="h-5.5 w-5.5" />}
          variant={micOn ? 'default' : 'active'}
          onClick={onToggleMic}
          aria-label="Toggle microphone"
        />
        <IconButton
          icon={
            cameraOn ? (
              <CameraIcon className="h-5.5 w-5.5" />
            ) : (
              <CameraOffIcon className="h-5.5 w-5.5" />
            )
          }
          variant={cameraOn ? 'default' : 'active'}
          onClick={onToggleCamera}
          aria-label="Toggle camera"
        />
      </div>
    </div>
  )
}
