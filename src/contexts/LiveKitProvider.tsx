import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ConnectionError,
  ConnectionErrorReason,
  ConnectionQuality,
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
} from 'livekit-client'
import { requestToken, TokenRequestError } from '@/services/livekit'
import { getParticipantSeedColor } from '@/lib/participantColors'
import type { ConnectionQualityLevel, Participant } from '@/types'
import { LiveKitContext, type LiveKitConnectionState } from './LiveKitContext'

const RECONNECTED_BADGE_MS = 3000

function mapConnectionError(err: unknown): string {
  if (err instanceof TokenRequestError) {
    return err.message
  }
  if (err instanceof ConnectionError) {
    switch (err.reason) {
      case ConnectionErrorReason.NotAllowed:
        return 'This meeting link is invalid or has expired.'
      case ConnectionErrorReason.ServerUnreachable:
      case ConnectionErrorReason.WebSocket:
      case ConnectionErrorReason.ServiceNotFound:
        return 'Could not reach the meeting server. Check your connection and try again.'
      case ConnectionErrorReason.Timeout:
        return 'Connection timed out. Please try again.'
      case ConnectionErrorReason.Cancelled:
        return 'Connection was cancelled.'
      default:
        return 'Could not connect to the room. Please try again.'
    }
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return 'Something went wrong joining the room.'
}

function mapConnectionQuality(quality: ConnectionQuality): ConnectionQualityLevel {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return 'excellent'
    case ConnectionQuality.Good:
      return 'good'
    case ConnectionQuality.Poor:
      return 'poor'
    case ConnectionQuality.Lost:
      return 'lost'
    default:
      return 'unknown'
  }
}

function mapRemoteParticipant(participant: RemoteParticipant): Participant {
  const videoPublication = participant.getTrackPublication(Track.Source.Camera)
  const videoTrack = videoPublication?.videoTrack
  const screenPublication = participant.getTrackPublication(Track.Source.ScreenShare)
  const screenTrack = screenPublication?.videoTrack

  return {
    id: participant.identity,
    name: participant.name || participant.identity,
    isSelf: false,
    micMuted: !participant.isMicrophoneEnabled,
    cameraOff: !participant.isCameraEnabled,
    seedColor: getParticipantSeedColor(participant.identity),
    videoStream: videoTrack?.mediaStream ?? null,
    isPresenting: !!screenTrack,
    screenShareStream: screenTrack?.mediaStream ?? null,
    connectionQuality: mapConnectionQuality(participant.connectionQuality),
  }
}

export function LiveKitProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] = useState<LiveKitConnectionState>('idle')
  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([])
  const [localConnectionQuality, setLocalConnectionQuality] =
    useState<ConnectionQualityLevel>('unknown')
  const [justReconnected, setJustReconnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [canPlaybackAudio, setCanPlaybackAudio] = useState(true)
  const [activeRemoteSpeakerId, setActiveRemoteSpeakerId] = useState<string | null>(null)

  const roomRef = useRef<Room | null>(null)
  const audioElementsRef = useRef<Map<string, HTMLMediaElement>>(new Map())
  const attemptIdRef = useRef(0)
  const busyRef = useRef(false)
  const reconnectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Dev-only diagnostics: a ref (not state) so reading it right after
  // `await connect()` always gets the value written during that same call,
  // never a stale one captured by an earlier render's closure.
  const lastJoinErrorRef = useRef<{ name: string; message: string } | null>(null)

  const syncParticipants = useCallback(() => {
    const currentRoom = roomRef.current
    if (!currentRoom) return
    setRemoteParticipants(
      Array.from(currentRoom.remoteParticipants.values()).map(mapRemoteParticipant),
    )
  }, [])

  const teardownRoom = useCallback((target: Room) => {
    target.removeAllListeners()
    audioElementsRef.current.forEach((el) => {
      el.pause()
      el.remove()
    })
    audioElementsRef.current.clear()
    if (reconnectedTimerRef.current) {
      clearTimeout(reconnectedTimerRef.current)
      reconnectedTimerRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    attemptIdRef.current += 1 // invalidate any in-flight connect attempt
    busyRef.current = false
    const current = roomRef.current
    if (current) {
      teardownRoom(current)
      // Local media tracks are owned by useLocalMedia, not the Room — never
      // let the room stop hardware it doesn't own.
      void current.disconnect(false)
    }
    roomRef.current = null
    setRoom(null)
    setRemoteParticipants([])
    setConnectionState('disconnected')
    setCanPlaybackAudio(true)
    setActiveRemoteSpeakerId(null)
  }, [teardownRoom])

  const connect = useCallback(
    async (roomId: string, participantName: string, localStream: MediaStream | null) => {
      if (roomRef.current?.state === ConnectionState.Connected) {
        return true // already connected — never reconnect
      }
      if (busyRef.current) {
        return false // a connect attempt is already in flight
      }
      busyRef.current = true

      const attemptId = ++attemptIdRef.current
      setError(null)
      setConnectionState('connecting')

      const isStale = () => attemptId !== attemptIdRef.current

      // Dev-only join-flow trace (Module 9.5): narrates each step to the
      // console and — via `currentStep`/`diagnosticRoom` below — lets the
      // catch block attribute a failure to an exact step with LiveKit
      // context. Purely additive: every `if (import.meta.env.DEV)` branch is
      // dead-code-eliminated from production bundles, so this changes
      // nothing about production behavior, timing, or control flow.
      let currentStep = 'requesting_token'
      let diagnosticRoom: Room | null = null

      try {
        if (import.meta.env.DEV) console.log('[Join] 5. Requesting token…')
        const token = await requestToken(roomId, participantName)
        if (isStale()) return false
        if (import.meta.env.DEV) {
          console.log('[Join] 6. Token received', {
            room: roomId,
            participantIdentity: participantName,
          })
        }

        const livekitUrl = import.meta.env.VITE_LIVEKIT_URL
        if (!livekitUrl) {
          throw new Error('The meeting server is not configured.')
        }

        const nextRoom = new Room({ adaptiveStream: true, dynacast: true })
        diagnosticRoom = nextRoom

        nextRoom.on(RoomEvent.ParticipantConnected, syncParticipants)
        nextRoom.on(RoomEvent.ParticipantDisconnected, syncParticipants)
        nextRoom.on(RoomEvent.TrackPublished, syncParticipants)
        nextRoom.on(RoomEvent.TrackUnpublished, syncParticipants)
        nextRoom.on(RoomEvent.TrackMuted, syncParticipants)
        nextRoom.on(RoomEvent.TrackUnmuted, syncParticipants)

        nextRoom.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
          if (isStale()) return
          if (participant.isLocal) {
            setLocalConnectionQuality(mapConnectionQuality(quality))
          } else {
            syncParticipants()
          }
        })

        nextRoom.on(RoomEvent.TrackSubscribed, (_track, publication, participant) => {
          syncParticipants()
          // Play remote audio through a hidden element. Never for the local
          // participant — that would echo the user's own mic back to them.
          if (publication.kind === Track.Kind.Audio && publication.track) {
            const el = publication.track.attach()
            el.style.display = 'none'
            document.body.appendChild(el)
            audioElementsRef.current.set(`${participant.identity}:${publication.trackSid}`, el)
          }
        })

        nextRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          const key = `${participant.identity}:${publication.trackSid}`
          const el = audioElementsRef.current.get(key)
          if (el) {
            track.detach(el)
            el.remove()
            audioElementsRef.current.delete(key)
          }
          syncParticipants()
        })

        nextRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
          if (isStale()) return
          if (state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) {
            setConnectionState('reconnecting')
          } else if (state === ConnectionState.Connected) {
            setConnectionState('connected')
          }
        })
        nextRoom.on(RoomEvent.Reconnected, () => {
          if (isStale()) return
          setConnectionState('connected')
          setJustReconnected(true)
          if (reconnectedTimerRef.current) clearTimeout(reconnectedTimerRef.current)
          reconnectedTimerRef.current = setTimeout(() => {
            setJustReconnected(false)
            reconnectedTimerRef.current = null
          }, RECONNECTED_BADGE_MS)
        })
        nextRoom.on(RoomEvent.Disconnected, () => {
          if (isStale()) return
          setConnectionState('disconnected')
          setRemoteParticipants([])
        })
        // Browsers can block autoplay of the remote audio elements we attach
        // in TrackSubscribed above; LiveKit surfaces that here so the UI can
        // prompt for a user gesture to unlock it via startAudio().
        nextRoom.on(RoomEvent.AudioPlaybackStatusChanged, () => {
          if (isStale()) return
          setCanPlaybackAudio(nextRoom.canPlaybackAudio)
        })

        // Speakers are sorted loudest-first; the local participant is
        // excluded because the layout only ever spotlights remote speakers.
        nextRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          if (isStale()) return
          const loudestRemote = speakers.find((speaker) => !speaker.isLocal)
          setActiveRemoteSpeakerId(loudestRemote?.identity ?? null)
        })

        currentStep = 'room_connect'
        if (import.meta.env.DEV) console.log('[Join] 7. Calling room.connect()…')
        await nextRoom.connect(livekitUrl, token)
        if (import.meta.env.DEV) console.log('[Join] 8. room.connect() succeeded')

        if (isStale()) {
          teardownRoom(nextRoom)
          void nextRoom.disconnect(false)
          return false
        }

        roomRef.current = nextRoom
        setRoom(nextRoom)
        setCanPlaybackAudio(nextRoom.canPlaybackAudio)

        if (localStream) {
          const tracks = [...localStream.getVideoTracks(), ...localStream.getAudioTracks()]
          currentStep = 'publish_tracks'
          await Promise.all(
            tracks.map((track) => {
              if (import.meta.env.DEV) {
                console.log(
                  track.kind === 'video' ? '[Join] 10. Publishing camera…' : '[Join] 9. Publishing microphone…',
                )
              }
              return nextRoom.localParticipant
                .publishTrack(track, {
                  source: track.kind === 'video' ? Track.Source.Camera : Track.Source.Microphone,
                })
                .catch((err) => {
                  // Publishing one track failing shouldn't fail the whole join —
                  // the participant simply appears without that track. Still
                  // worth seeing in dev, since this is exactly the kind of
                  // per-track failure that's otherwise invisible.
                  if (import.meta.env.DEV) {
                    console.error(`[Join] Publishing ${track.kind} track failed:`, err)
                  }
                })
            }),
          )
          if (import.meta.env.DEV) console.log('[Join] 11. Publish completed')
        }

        if (isStale()) return false

        syncParticipants()
        setConnectionState('connected')
        return true
      } catch (err) {
        if (isStale()) return false
        if (import.meta.env.DEV) {
          // Dev-only: capture the real exception for getDevJoinErrorDetail(),
          // and log it in full with exactly which step it happened on. None
          // of this runs in a production build, and none of it feeds into
          // the production-facing `error` message set below.
          const name = err instanceof Error ? err.name : typeof err
          const message = err instanceof Error ? err.message : String(err)
          lastJoinErrorRef.current = { name, message }
          console.error(`[Join] Step failed: ${currentStep}`, err)
          console.error('[Join] Exception object:', err)
          console.error('[Join] Exception name:', name)
          console.error('[Join] Exception message:', message)
          if (err instanceof ConnectionError) {
            console.error('[Join] LiveKit context:', {
              // This attempt has been 'connecting' since the top of this
              // function and is about to become 'failed' a few lines below —
              // there's no intermediate state to read for this attempt.
              connectionState: 'connecting',
              roomState: diagnosticRoom?.state ?? 'room not created',
              participantIdentity: diagnosticRoom?.localParticipant?.identity || participantName,
            })
          }
        }
        setError(mapConnectionError(err))
        setConnectionState('failed')
        return false
      } finally {
        if (!isStale()) busyRef.current = false
      }
    },
    [syncParticipants, teardownRoom],
  )

  const getDevJoinErrorDetail = useCallback(() => {
    if (!import.meta.env.DEV) return null
    const detail = lastJoinErrorRef.current
    return detail ? `${detail.name}: ${detail.message}` : null
  }, [])

  // Must be invoked from a direct user gesture (click/tap) — that's what
  // lets the browser's autoplay policy allow audio playback to resume.
  const unlockAudio = useCallback(() => {
    const current = roomRef.current
    if (!current) return
    void current.startAudio().then(() => {
      setCanPlaybackAudio(current.canPlaybackAudio)
    })
  }, [])

  // Browser-level connectivity loss (e.g. wifi drops, tab backgrounded on a
  // spotty connection): react immediately rather than waiting for LiveKit's
  // own heartbeat timeout to notice. LiveKit still drives the actual
  // reconnect/Reconnected transition — this only makes the "something's
  // wrong" feedback appear sooner.
  useEffect(() => {
    function handleOffline() {
      if (roomRef.current?.state === ConnectionState.Connected) {
        setConnectionState('reconnecting')
      }
    }
    window.addEventListener('offline', handleOffline)
    return () => window.removeEventListener('offline', handleOffline)
  }, [])

  // Full cleanup when this provider unmounts (leaving the room's page
  // entirely, or a refresh tearing down the whole SPA).
  useEffect(() => {
    return () => {
      attemptIdRef.current += 1
      busyRef.current = false
      const current = roomRef.current
      if (current) {
        teardownRoom(current)
        void current.disconnect(false)
      }
      roomRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({
      room,
      localParticipant: room?.localParticipant ?? null,
      connectionState,
      remoteParticipants,
      localConnectionQuality,
      activeRemoteSpeakerId,
      justReconnected,
      error,
      canPlaybackAudio,
      unlockAudio,
      getDevJoinErrorDetail,
      connect,
      disconnect,
    }),
    [
      room,
      connectionState,
      remoteParticipants,
      localConnectionQuality,
      activeRemoteSpeakerId,
      justReconnected,
      error,
      canPlaybackAudio,
      unlockAudio,
      getDevJoinErrorDetail,
      connect,
      disconnect,
    ],
  )

  return <LiveKitContext.Provider value={value}>{children}</LiveKitContext.Provider>
}
