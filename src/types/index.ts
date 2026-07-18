export type ConnectionQualityLevel = 'excellent' | 'good' | 'poor' | 'lost' | 'unknown'

export interface Participant {
  id: string
  name: string
  isSelf?: boolean
  isHost?: boolean
  micMuted: boolean
  cameraOff: boolean
  seedColor: string
  /** Live camera feed, when the participant's camera is on. Null/undefined falls back to the avatar. */
  videoStream?: MediaStream | null
  /** True while this participant is screen-sharing. */
  isPresenting?: boolean
  /** The shared-screen feed, when isPresenting is true. */
  screenShareStream?: MediaStream | null
  connectionQuality?: ConnectionQualityLevel
}
