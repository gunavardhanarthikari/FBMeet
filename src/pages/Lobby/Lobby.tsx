import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PreviewCard } from '@/components/lobby/PreviewCard'
import { InputField } from '@/components/ui/InputField'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CopyLinkButton } from '@/components/ui/CopyLinkButton'
import { useMeeting, useLiveKit } from '@/contexts'
import type { UseLocalMediaResult } from '@/hooks/useLocalMedia'
import { buildRoomUrl } from '@/lib/roomUrl'

const MAX_NAME_LENGTH = 40

interface LobbyProps {
  roomId: string
  isHost: boolean
  media: UseLocalMediaResult
}

export function Lobby({ roomId, isHost, media }: LobbyProps) {
  const { displayName, setDisplayName, setJoined } = useMeeting()
  const liveKit = useLiveKit()
  const [name, setName] = useState(displayName)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  const connecting = joining || liveKit.connectionState === 'connecting'

  // Media acquisition happens only from this explicit user gesture — never
  // from a mount effect — so the browser's permission prompt is always tied
  // to the user clicking "Join now", never surprises them on page load.
  // `requestMedia()` resolves with the freshly-acquired stream itself
  // (rather than us reading `media.stream` afterwards), because this
  // function's own `media` closure is fixed at render time: awaiting
  // doesn't refresh it, so re-reading `media.stream` post-await could still
  // see the pre-acquisition (empty) value.
  async function handleJoin() {
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
    setDisplayName(trimmed)
    setJoining(true)

    // Dev-only join-flow trace (Module 9.5): narrates each step to the
    // console, and `currentStep` lets the catch block below attribute an
    // unexpected throw to exactly where it happened. Steps 5–11 (token
    // request, room.connect(), publishing) are traced inside
    // LiveKitProvider.connect() itself, where those operations actually
    // happen. Every branch here is gated on `import.meta.env.DEV`, which is
    // a compile-time `false` in production builds and dead-code-eliminated,
    // so none of this exists in what ships.
    let currentStep = 'join_button_clicked'
    if (import.meta.env.DEV) console.log('[Join] 1. Join button clicked', { roomId, name: trimmed })

    try {
      currentStep = 'requestMedia_started'
      if (import.meta.env.DEV) console.log('[Join] 2. requestMedia() started')

      const stream = await media.requestMedia()

      currentStep = 'requestMedia_completed'
      if (import.meta.env.DEV) {
        console.log('[Join] 3. requestMedia() completed')
        console.log('[Join] 4. MediaStream acquired', {
          audioTracks: stream?.getAudioTracks().length ?? 0,
          videoTracks: stream?.getVideoTracks().length ?? 0,
        })
      }

      currentStep = 'liveKit_connect'
      const connected = await liveKit.connect(roomId, trimmed, stream)
      if (!connected) {
        // getDevJoinErrorDetail() reads from a ref inside LiveKitProvider, so
        // — unlike `liveKit.error` here, which is fixed to whatever this
        // closure's context snapshot was before the click — it always
        // reflects the failure that JUST happened. It only ever returns
        // non-null in a dev build; production keeps the generic message.
        const devDetail = liveKit.getDevJoinErrorDetail()
        setError(devDetail ?? liveKit.error ?? 'Could not join the room. Please try again.')
        return
      }

      if (import.meta.env.DEV) console.log('[Join] 12. Join completed successfully')
      setJoined(true)
    } catch (err) {
      // connect() already catches its own errors internally and returns
      // `false` rather than throwing — so reaching here means something
      // outside that (e.g. requestMedia()) threw unexpectedly. Logged, then
      // rethrown unchanged so production behavior (propagate to the nearest
      // error boundary) is identical whether or not this catch exists.
      if (import.meta.env.DEV) {
        console.error(`[Join] Step failed: ${currentStep}`, err)
        console.error('[Join] Exception object:', err)
        console.error('[Join] Exception name:', err instanceof Error ? err.name : typeof err)
        console.error(
          '[Join] Exception message:',
          err instanceof Error ? err.message : String(err),
        )
      }
      throw err
    } finally {
      setJoining(false)
    }
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

        <PrimaryButton onClick={handleJoin} disabled={connecting}>
          {connecting ? 'Joining…' : 'Join now'}
        </PrimaryButton>

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
