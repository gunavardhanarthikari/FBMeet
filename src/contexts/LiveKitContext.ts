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
  justReconnected: boolean
  error: string | null
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
