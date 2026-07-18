import type { Participant } from '@/types'

export const mockParticipants: Participant[] = [
  {
    id: 'self',
    name: 'You',
    isSelf: true,
    isHost: true,
    micMuted: false,
    cameraOff: false,
    seedColor: '#0d3a37',
  },
  { id: 'p1', name: 'Su Li-zhen', micMuted: false, cameraOff: false, seedColor: '#0f423d' },
  { id: 'p2', name: 'Chow Mo-wan', micMuted: true, cameraOff: false, seedColor: '#123a44' },
  { id: 'p3', name: 'Mr. Ho', micMuted: false, cameraOff: true, seedColor: '#0d3336' },
  { id: 'p4', name: 'Ah Ping', micMuted: false, cameraOff: false, seedColor: '#15413c' },
  { id: 'p5', name: 'Mrs. Suen', micMuted: true, cameraOff: false, seedColor: '#0e3a3f' },
]
