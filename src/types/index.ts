export interface Participant {
  id: string
  name: string
  isSelf?: boolean
  isHost?: boolean
  micMuted: boolean
  cameraOff: boolean
  seedColor: string
}
