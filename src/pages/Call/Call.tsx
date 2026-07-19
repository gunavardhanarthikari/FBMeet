import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Track } from 'livekit-client'
import { Header } from '@/components/call/Header'
import { ControlBar } from '@/components/call/ControlBar'
import { ParticipantTile } from '@/components/call/ParticipantTile'
import { ScreenShareDialog } from '@/components/dialogs/ScreenShareDialog'
import { PresentationStage } from '@/components/call/PresentationStage'
import { DebugOverlay } from '@/components/debug/DebugOverlay'
import { SpeakerMutedIcon } from '@/components/ui/icons'
import { useMeeting, useLiveKit } from '@/contexts'
import type { UseLocalMediaResult } from '@/hooks/useLocalMedia'
import type { Participant } from '@/types'

// Gated on both a dev build AND the query param — `import.meta.env.DEV` is
// stripped to `false` in production bundles (and dead-code-eliminated by
// Vite), so `?debug=true` alone can never expose this on a deployed build.
const DEBUG_OVERLAY_AVAILABLE = import.meta.env.DEV

interface CallProps {
  roomId: string
  isHost: boolean
  media: UseLocalMediaResult
}

// A row of smaller tiles for whoever isn't currently the main focus — used
// both below the presenter's shared screen and below a spotlighted speaker,
// so the two cases share one definition instead of two near-duplicate grids.
function RemoteFilmstrip({
  participants,
  isHost,
  activeSpeakerId,
}: {
  participants: Participant[]
  isHost: boolean
  activeSpeakerId: string | null
}) {
  if (participants.length === 0) return null
  return (
    <div className="grid auto-cols-52.5 grid-flow-col gap-3.5 overflow-x-auto">
      {participants.map((p) => (
        <ParticipantTile
          key={p.id}
          participant={p}
          isHostView={isHost}
          isSpeaking={p.id === activeSpeakerId}
        />
      ))}
    </div>
  )
}

// How long a new active speaker has to stay loudest before the spotlight
// actually switches to them. Without this, the spotlighted tile would swap
// (and its video element remount) on every brief pause/interjection, which
// reads as the layout "jumping" rather than transitioning smoothly.
const SPOTLIGHT_SWITCH_DELAY_MS = 1200

export function Call({ roomId, isHost, media }: CallProps) {
  const navigate = useNavigate()
  const { displayName, setJoined } = useMeeting()
  const liveKit = useLiveKit()
  const [searchParams] = useSearchParams()
  const debugOverlayEnabled = DEBUG_OVERLAY_AVAILABLE && searchParams.get('debug') === 'true'

  const [showShareConfirm, setShowShareConfirm] = useState(false)

  // Lobby and Call are swapped in place by Room.tsx rather than a route change,
  // so a scroll position picked up in a taller Lobby layout (common on small
  // screens) would otherwise carry over and hide the header behind the fold.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Keep the published camera track in sync with the local toggle: unlike
  // muting the mic (which just disables the existing track and is already
  // reflected for remote listeners at the media level), turning the camera
  // off fully releases the device, so the room publication has to be
  // explicitly dropped/recreated to avoid a frozen frame for everyone else.
  useEffect(() => {
    const localParticipant = liveKit.localParticipant
    if (!localParticipant || liveKit.connectionState !== 'connected') return

    const publication = localParticipant.getTrackPublication(Track.Source.Camera)
    const videoTrack = media.stream?.getVideoTracks()[0]

    if (media.cameraOn && videoTrack && !publication) {
      void localParticipant
        .publishTrack(videoTrack, { source: Track.Source.Camera })
        .catch(() => {})
    } else if (!media.cameraOn && publication?.track) {
      void localParticipant.unpublishTrack(publication.track).catch(() => {})
    }
  }, [media.cameraOn, media.stream, liveKit.localParticipant, liveKit.connectionState])

  // Mic muting itself already works at the media level (a disabled track
  // transmits silence), but remote peers only see the "muted" badge update
  // if LiveKit's own mute signaling fires — so mirror the intent through the
  // publication too. useLocalMedia still owns the hardware track; this just
  // tells the room what it already decided.
  useEffect(() => {
    const localParticipant = liveKit.localParticipant
    if (!localParticipant || liveKit.connectionState !== 'connected') return

    const publication = localParticipant.getTrackPublication(Track.Source.Microphone)
    if (!publication) return

    if (media.micOn && publication.isMuted) {
      void publication.unmute()
    } else if (!media.micOn && !publication.isMuted) {
      void publication.mute()
    }
  }, [media.micOn, liveKit.localParticipant, liveKit.connectionState])

  // Publish/unpublish the screen-share track as the user starts/stops
  // presenting, and react to the browser's own "Stop sharing" bar the same
  // way (useLocalMedia already clears screenStream when that happens).
  useEffect(() => {
    const localParticipant = liveKit.localParticipant
    if (!localParticipant || liveKit.connectionState !== 'connected') return

    const videoPublication = localParticipant.getTrackPublication(Track.Source.ScreenShare)
    const audioPublication = localParticipant.getTrackPublication(Track.Source.ScreenShareAudio)
    const screenVideoTrack = media.screenStream?.getVideoTracks()[0]
    const screenAudioTrack = media.screenStream?.getAudioTracks()[0]

    if (media.isSharing && screenVideoTrack && !videoPublication) {
      void localParticipant
        .publishTrack(screenVideoTrack, { source: Track.Source.ScreenShare })
        .catch(() => {})
      if (screenAudioTrack) {
        void localParticipant
          .publishTrack(screenAudioTrack, { source: Track.Source.ScreenShareAudio })
          .catch(() => {})
      }
    } else if (!media.isSharing) {
      if (videoPublication?.track) void localParticipant.unpublishTrack(videoPublication.track).catch(() => {})
      if (audioPublication?.track) void localParticipant.unpublishTrack(audioPublication.track).catch(() => {})
    }
  }, [media.isSharing, media.screenStream, liveKit.localParticipant, liveKit.connectionState])

  const selfParticipant: Participant = useMemo(
    () => ({
      id: 'self',
      name: displayName || 'You',
      isSelf: true,
      isHost,
      micMuted: !media.micOn,
      cameraOff: !media.cameraOn,
      seedColor: '#0d3a37',
      videoStream: media.cameraOn ? media.stream : null,
      isPresenting: media.isSharing,
      screenShareStream: media.isSharing ? media.screenStream : null,
      connectionQuality: liveKit.localConnectionQuality,
    }),
    [
      displayName,
      isHost,
      media.micOn,
      media.cameraOn,
      media.stream,
      media.isSharing,
      media.screenStream,
      liveKit.localConnectionQuality,
    ],
  )

  const remoteParticipants = liveKit.remoteParticipants
  const participants = useMemo(
    () => [selfParticipant, ...remoteParticipants],
    [selfParticipant, remoteParticipants],
  )

  // Screen share always takes priority, from either side — preserved as-is
  // from the previous layout.
  const presenter = useMemo(() => participants.find((p) => p.isPresenting), [participants])

  const alone = remoteParticipants.length === 0

  // Debounced/"sticky" version of the raw active-speaker id: it only follows
  // a *new* speaker after they've held the floor for SPOTLIGHT_SWITCH_DELAY_MS,
  // and otherwise keeps showing whoever was last spotlighted through brief
  // pauses. This is what decides which tile is large (a DOM/layout change);
  // the raw id is still used below for the instant per-tile speaking
  // highlight, which is just a border toggle and doesn't need debouncing.
  const [stableSpeakerId, setStableSpeakerId] = useState<string | null>(null)
  useEffect(() => {
    const raw = liveKit.activeRemoteSpeakerId
    if (!raw || raw === stableSpeakerId) return
    const timer = setTimeout(() => setStableSpeakerId(raw), SPOTLIGHT_SWITCH_DELAY_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveKit.activeRemoteSpeakerId])

  // With nobody presenting, a single remote is always the natural focus; with
  // several, the loudest active speaker gets it (falling back to nobody
  // spotlighted — an even gallery — until someone actually speaks). Looking
  // the sticky id up with `.find` (rather than trusting it directly) also
  // means a spotlighted participant who leaves the call naturally falls back
  // to null here, with no separate cleanup effect needed.
  const spotlightRemote = useMemo(() => {
    if (presenter || remoteParticipants.length === 0) return null
    if (remoteParticipants.length === 1) return remoteParticipants[0]
    return remoteParticipants.find((p) => p.id === stableSpeakerId) ?? null
  }, [presenter, remoteParticipants, stableSpeakerId])

  const galleryRemotes = useMemo(
    () =>
      spotlightRemote ? remoteParticipants.filter((p) => p.id !== spotlightRemote.id) : remoteParticipants,
    [spotlightRemote, remoteParticipants],
  )

  const maxColumns = Math.min(4, Math.ceil(Math.sqrt(galleryRemotes.length)))
  const gridVars = {
    '--cols-base': Math.min(2, galleryRemotes.length),
    '--cols-sm': Math.min(3, maxColumns),
    '--cols-lg': maxColumns,
  } as CSSProperties

  // The floating self tile defaults to the bottom-right corner (the
  // conventional PiP spot), except when a filmstrip of other tiles already
  // occupies that space — presenter mode with remote participants, or a
  // spotlight with others left over — in which case it moves to the top
  // right so the two never overlap.
  const hasBottomFilmstrip = presenter
    ? remoteParticipants.length > 0
    : Boolean(spotlightRemote) && galleryRemotes.length > 0

  // `media` is a fresh object every render (useLocalMedia doesn't memoize its
  // return value), so depending on it whole would defeat these useCallbacks'
  // purpose entirely. Each field accessed below is itself a stable
  // useCallback/state value from the hook, which is what actually matters.
  const handleToggleShare = useCallback(() => {
    if (media.isSharing) {
      media.stopScreenShare()
    } else if (media.screenShareSupported) {
      setShowShareConfirm(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.isSharing, media.screenShareSupported, media.stopScreenShare])

  const handleConfirmShare = useCallback(async () => {
    setShowShareConfirm(false)
    await media.startScreenShare()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.startScreenShare])

  const handleCancelShare = useCallback(() => setShowShareConfirm(false), [])

  const handleLeave = useCallback(() => {
    liveKit.disconnect()
    media.release()
    setJoined(false)
    navigate('/left', { state: { roomId } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveKit.disconnect, media.release, setJoined, navigate, roomId])

  return (
    <div className="h-call-viewport animate-mood-fade flex flex-col overflow-hidden">
      <Header
        roomId={roomId}
        isHost={isHost}
        connectionState={liveKit.connectionState}
        justReconnected={liveKit.justReconnected}
      />

      {!liveKit.canPlaybackAudio && (
        <button
          type="button"
          onClick={liveKit.unlockAudio}
          className="flex items-center justify-center gap-2 border-b border-border-default bg-wash-accent-strong px-4 py-2 font-mono text-xs tracking-[0.08em] text-accent-muted uppercase transition-colors duration-300 ease-out-soft hover:bg-wash-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <SpeakerMutedIcon className="h-4 w-4 shrink-0" />
          Tap to enable sound
        </button>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
        {presenter ? (
          <>
            <PresentationStage
              name={presenter.name}
              isSelf={!!presenter.isSelf}
              stream={presenter.isSelf ? media.screenStream : presenter.screenShareStream ?? null}
            />
            <RemoteFilmstrip
              participants={remoteParticipants}
              isHost={isHost}
              activeSpeakerId={liveKit.activeRemoteSpeakerId}
            />
          </>
        ) : alone ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="aspect-video w-full max-w-3xl">
              <ParticipantTile participant={selfParticipant} variant="stage" />
            </div>
            <p className="text-center font-mono text-xs text-text-muted">
              Waiting for others to join — share the link above.
            </p>
          </div>
        ) : (
          <>
            {spotlightRemote && (
              <div className="min-h-0 flex-1">
                <ParticipantTile
                  participant={spotlightRemote}
                  isHostView={isHost}
                  variant="stage"
                  isSpeaking={spotlightRemote.id === liveKit.activeRemoteSpeakerId}
                />
              </div>
            )}
            {spotlightRemote ? (
              <RemoteFilmstrip
                participants={galleryRemotes}
                isHost={isHost}
                activeSpeakerId={liveKit.activeRemoteSpeakerId}
              />
            ) : (
              galleryRemotes.length > 0 && (
                <div
                  className="grid flex-1 content-center gap-3.5 overflow-auto grid-cols-[repeat(var(--cols-base),1fr)] sm:grid-cols-[repeat(var(--cols-sm),1fr)] lg:grid-cols-[repeat(var(--cols-lg),1fr)]"
                  style={gridVars}
                >
                  {galleryRemotes.map((p) => (
                    <ParticipantTile
                      key={p.id}
                      participant={p}
                      isHostView={isHost}
                      isSpeaking={p.id === liveKit.activeRemoteSpeakerId}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}

        {!alone && (
          <div
            className={`absolute z-10 ${hasBottomFilmstrip ? 'top-4' : 'bottom-4'} right-4`}
            style={{
              width: 'clamp(84px, 24vw, 176px)',
              marginTop: hasBottomFilmstrip ? 'env(safe-area-inset-top)' : undefined,
              marginBottom: hasBottomFilmstrip ? undefined : 'env(safe-area-inset-bottom)',
              marginRight: 'env(safe-area-inset-right)',
            }}
          >
            <ParticipantTile participant={selfParticipant} variant="floating" />
          </div>
        )}
      </div>

      <ControlBar
        micOn={media.micOn}
        cameraOn={media.cameraOn}
        sharing={media.isSharing}
        shareSupported={media.screenShareSupported}
        onToggleMic={media.toggleMic}
        onToggleCamera={media.toggleCamera}
        onToggleShare={handleToggleShare}
        onLeave={handleLeave}
      />

      {showShareConfirm && (
        <ScreenShareDialog fast onConfirm={handleConfirmShare} onCancel={handleCancelShare} />
      )}

      {debugOverlayEnabled && <DebugOverlay media={media} />}
    </div>
  )
}
