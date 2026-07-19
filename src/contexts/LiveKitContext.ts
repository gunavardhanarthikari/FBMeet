import { createContext, useContext } from 'react'
import type { LocalParticipant, Room } from 'livekit-client'
import type { ConnectionQualityLevel, Participant } from '@/types'

export type LiveKitConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed'

export interface LiveKitContextValue {
  room: Room | null
  localParticipant: LocalParticipant | null
  connectionState: LiveKitConnectionState
  remoteParticipants: Participant[]
  localConnectionQuality: ConnectionQualityLevel
  /** Identity of the loudest currently-speaking remote participant, or null
   *  when nobody remote is speaking (or nobody has spoken yet). */
  activeRemoteSpeakerId: string | null
  justReconnected: boolean
  error: string | null
  /** False when the browser has blocked autoplay of a remote participant's
   *  audio — call `unlockAudio()` from a user gesture to resume playback. */
  canPlaybackAudio: boolean
  unlockAudio: () => void
  /**
   * Dev-only diagnostics for the last failed `connect()` attempt, formatted
   * as `"<ErrorName>: <message>"`. Always returns `null` in production
   * builds (`import.meta.env.DEV` is `false` there) — callers should fall
   * back to `error`/a generic message when this returns `null`.
   */
  getDevJoinErrorDetail: () => string | null
  connect: (roomId: string, participantName: string, localStream: MediaStream | null) => Promise<boolean>
  disconnect: () => void
}

export const LiveKitContext = createContext<LiveKitContextValue | null>(null)

export function useLiveKit() {
  const ctx = useContext(LiveKitContext)
  if (!ctx) {
    throw new Error('useLiveKit must be used within a LiveKitProvider')
  }
  return ctx
}
