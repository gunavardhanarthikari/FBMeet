import { useEffect, useRef } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface PresentationStageProps {
  name: string
  isSelf: boolean
  stream: MediaStream | null
}

export function PresentationStage({ name, isSelf, stream }: PresentationStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    if (video.srcObject !== stream) {
      video.srcObject = stream
    }
    video.play().catch(() => {})
  }, [stream])

  return (
    <div className="shadow-share-frame relative flex-1 overflow-hidden rounded-md border border-border-accent bg-black">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-mono text-xs text-white/60">
          Waiting for the shared screen…
        </div>
      )}
      <StatusBadge dot pulse variant="pill" className="absolute top-2 left-2">
        {isSelf ? 'You are presenting' : `${name} is presenting`}
      </StatusBadge>
    </div>
  )
}
