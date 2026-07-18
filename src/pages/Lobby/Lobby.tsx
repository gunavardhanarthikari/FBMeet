import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PreviewCard } from '@/components/lobby/PreviewCard'
import { InputField } from '@/components/ui/InputField'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CopyLinkButton } from '@/components/ui/CopyLinkButton'
import { useMeeting } from '@/contexts'
import { useLocalMedia } from '@/hooks/useLocalMedia'
import { buildRoomUrl } from '@/lib/roomUrl'

const MAX_NAME_LENGTH = 40

interface LobbyProps {
  roomId: string
  isHost: boolean
}

export function Lobby({ roomId, isHost }: LobbyProps) {
  const { displayName, setDisplayName, setJoined } = useMeeting()
  const [name, setName] = useState(displayName)
  const [error, setError] = useState('')
  const media = useLocalMedia()

  function handleJoin() {
    const trimmed = name.trim()

    if (!trimmed) {
      setError('Enter your name to join.')
      return
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`)
      return
    }

    setError('')
    media.requestMedia()
    console.log('join now', { roomId, name: trimmed })
    setDisplayName(trimmed)
    setJoined(true)
  }

  return (
    <div className="animate-mood-fade flex min-h-screen flex-wrap items-center justify-center gap-24 p-8 md:p-16">
      <div className="flex flex-col gap-2">
        <PreviewCard
          name={name}
          stream={media.stream}
          micOn={media.micOn}
          cameraOn={media.cameraOn}
          onToggleMic={media.toggleMic}
          onToggleCamera={media.toggleCamera}
        />

        {media.message && (
          <p className="w-[min(560px,90vw)] font-mono text-xs text-text-muted">
            {media.message}
            {(media.cameraDenied || media.micDenied) && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={media.retry}
                  className="text-accent-muted underline underline-offset-2"
                >
                  Retry
                </button>
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex w-[min(360px,90vw)] flex-col gap-6">
        <span className="font-mono text-xs tracking-[0.22em] text-accent-muted uppercase">
          {isHost ? 'You are the host' : 'Joining a room'}
        </span>

        <h2 className="font-display text-[40px] leading-[1.05] font-medium text-text-title">
          Ready to join?
        </h2>

        <div className="mt-3.5 flex items-center gap-2.5">
          <span className="font-mono text-sm tracking-[0.12em] text-text-soft">{roomId}</span>
          <CopyLinkButton text={buildRoomUrl(roomId)} autoTrigger={isHost} />
        </div>

        <div className="flex flex-col gap-2">
          <InputField
            id="lobby-name"
            label="Your name"
            placeholder="How the room will know you"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
          />
          {error && <p className="font-mono text-xs text-leave-border">{error}</p>}
        </div>

        <PrimaryButton onClick={handleJoin}>Join now</PrimaryButton>

        <Link
          to="/"
          className="text-center font-mono text-[11px] tracking-[0.22em] text-text-muted uppercase"
        >
          ← back
        </Link>
      </div>
    </div>
  )
}
