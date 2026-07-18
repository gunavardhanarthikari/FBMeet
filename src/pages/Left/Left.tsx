import { useLocation, useNavigate } from 'react-router-dom'
import { LeaveCard } from '@/components/left/LeaveCard'

export function Left() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomId = (location.state as { roomId?: string } | null)?.roomId

  return (
    <div className="animate-mood-fade flex min-h-screen items-center justify-center p-8 md:p-16">
      <LeaveCard
        onRejoin={() => {
          console.log('rejoin', roomId)
          navigate(roomId ? `/room/${roomId}` : '/')
        }}
        onReturnHome={() => {
          console.log('return home')
          navigate('/')
        }}
      />
    </div>
  )
}
