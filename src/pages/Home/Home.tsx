import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CameraIcon } from '@/components/ui/icons'
import { generateRoomId } from '@/lib/roomId'

export function Home() {
  const navigate = useNavigate()

  function handleNewMeeting() {
    const roomId = generateRoomId()
    console.log('new meeting', roomId)
    navigate(`/room/${roomId}`, { state: { justCreated: true } })
  }

  return (
    <div className="animate-mood-fade flex min-h-screen flex-col items-center justify-center p-8 md:p-16">
      <Logo className="mb-9 md:mb-24" />

      <div className="flex w-full max-w-110 flex-col gap-6 rounded-md border border-border-default bg-surface-card p-8 shadow-lg md:p-16">
        <PrimaryButton onClick={handleNewMeeting} className="w-full">
          <CameraIcon className="h-4.5 w-4.5" />
          New meeting
        </PrimaryButton>

        <p className="text-center font-body text-sm leading-[1.6] text-text-muted italic">
          A held shot before the conversation begins. Start a room and the share link is copied
          for you — send it, and whoever opens it arrives at their name and a join.
        </p>
      </div>
    </div>
  )
}
