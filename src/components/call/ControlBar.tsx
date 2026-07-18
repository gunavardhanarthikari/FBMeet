import { IconButton } from '@/components/ui/IconButton'
import {
  CameraIcon,
  CameraOffIcon,
  HangUpIcon,
  MicIcon,
  MicOffIcon,
  ScreenShareIcon,
} from '@/components/ui/icons'

interface ControlBarProps {
  micOn: boolean
  cameraOn: boolean
  sharing: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onToggleShare: () => void
  onLeave: () => void
}

export function ControlBar({
  micOn,
  cameraOn,
  sharing,
  onToggleMic,
  onToggleCamera,
  onToggleShare,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-4.5 border-t border-border-default p-5">
      <IconButton
        icon={micOn ? <MicIcon className="h-5.5 w-5.5" /> : <MicOffIcon className="h-5.5 w-5.5" />}
        variant={micOn ? 'default' : 'active'}
        onClick={onToggleMic}
        aria-label="Toggle microphone"
      />
      <IconButton
        icon={
          cameraOn ? (
            <CameraIcon className="h-5.5 w-5.5" />
          ) : (
            <CameraOffIcon className="h-5.5 w-5.5" />
          )
        }
        variant={cameraOn ? 'default' : 'active'}
        onClick={onToggleCamera}
        aria-label="Toggle camera"
      />
      <IconButton
        icon={<ScreenShareIcon className="h-5.5 w-5.5" />}
        variant={sharing ? 'active' : 'default'}
        onClick={onToggleShare}
        aria-label="Present now"
      />
      <IconButton
        icon={<HangUpIcon className="h-6 w-6" />}
        variant="leave"
        size={64}
        onClick={onLeave}
        aria-label="Leave call"
      />
    </div>
  )
}
