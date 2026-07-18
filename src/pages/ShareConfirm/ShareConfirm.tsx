import { useNavigate } from 'react-router-dom'
import { ScreenShareDialog } from '@/components/dialogs/ScreenShareDialog'

export function ShareConfirm() {
  const navigate = useNavigate()

  function handleConfirm() {
    console.log('start sharing')
    navigate('/room/demo-room')
  }

  function handleCancel() {
    console.log('cancel share')
    navigate('/room/demo-room')
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <ScreenShareDialog onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  )
}
