import { useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Lobby } from '@/pages/Lobby/Lobby'
import { Call } from '@/pages/Call/Call'
import { useMeeting, LiveKitProvider } from '@/contexts'
import { useLocalMedia } from '@/hooks/useLocalMedia'

export function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const location = useLocation()
  const { joined, setJoined } = useMeeting()
  const media = useLocalMedia()

  const isHost = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated)

  useEffect(() => {
    setJoined(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  if (!roomId) {
    return null
  }

  return (
    <LiveKitProvider>
      {joined ? (
        <Call roomId={roomId} isHost={isHost} media={media} />
      ) : (
        <Lobby roomId={roomId} isHost={isHost} media={media} />
      )}
    </LiveKitProvider>
  )
}
