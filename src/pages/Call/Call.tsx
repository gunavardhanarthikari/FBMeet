import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Track } from 'livekit-client'
import { Header } from '@/components/call/Header'
import { ControlBar } from '@/components/call/ControlBar'
import { ParticipantTile } from '@/components/call/ParticipantTile'
import { ScreenShareDialog } from '@/components/dialogs/ScreenShareDialog'
import { PresentationStage } from '@/components/call/PresentationStage'
import { useMeeting, useLiveKit } from '@/contexts'
import type { UseLocalMediaResult } from '@/hooks/useLocalMedia'
import type { Participant } from '@/types'

interface CallProps {
  roomId: string
  isHost: boolean
  media: UseLocalMediaResult
}

export function Call({ roomId, isHost, media }: CallProps) {
  const navigate = useNavigate()
  const { displayName, setJoined } = useMeeting()
  const liveKit = useLiveKit()

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

  const participants = useMemo(
    () => [selfParticipant, ...liveKit.remoteParticipants],
    [selfParticipant, liveKit.remoteParticipants],
  )

  const presenter = useMemo(() => participants.find((p) => p.isPresenting), [participants])

  const maxColumns = Math.min(4, Math.ceil(Math.sqrt(participants.length)))
  const gridVars = {
    '--cols-base': Math.min(2, participants.length),
    '--cols-sm': Math.min(3, maxColumns),
    '--cols-lg': maxColumns,
  } as CSSProperties

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
    <div className="animate-mood-fade flex min-h-screen flex-col">
      <Header
        roomId={roomId}
        isHost={isHost}
        connectionState={liveKit.connectionState}
        justReconnected={liveKit.justReconnected}
      />

      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
        {presenter && (
          <PresentationStage
            name={presenter.name}
            isSelf={!!presenter.isSelf}
            stream={presenter.isSelf ? media.screenStream : presenter.screenShareStream ?? null}
          />
        )}

        <div
          className={
            presenter
              ? 'grid auto-cols-52.5 grid-flow-col gap-3.5 overflow-x-auto'
              : 'grid flex-1 content-center gap-3.5 overflow-auto grid-cols-[repeat(var(--cols-base),1fr)] sm:grid-cols-[repeat(var(--cols-sm),1fr)] lg:grid-cols-[repeat(var(--cols-lg),1fr)]'
          }
          style={presenter ? undefined : gridVars}
        >
          {participants.map((p) => (
            <ParticipantTile key={p.id} participant={p} isHostView={isHost} />
          ))}
        </div>

        {!presenter && participants.length === 1 && (
          <p className="text-center font-mono text-xs text-text-muted">
            Waiting for others to join — share the link above.
          </p>
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
    </div>
  )
}
