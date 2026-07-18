import { memo } from 'react'
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
  shareSupported: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onToggleShare: () => void
  onLeave: () => void
}

function ControlBarComponent({
  micOn,
  cameraOn,
  sharing,
  shareSupported,
  onToggleMic,
  onToggleCamera,
  onToggleShare,
  onLeave,
}: ControlBarProps) {
  return (
    <div
      role="group"
      aria-label="Meeting controls"
      className="flex items-center justify-center gap-4.5 border-t border-border-default px-5 pt-5"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <IconButton
        icon={micOn ? <MicIcon className="h-5.5 w-5.5" /> : <MicOffIcon className="h-5.5 w-5.5" />}
        variant={micOn ? 'default' : 'active'}
        onClick={onToggleMic}
        aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
        aria-pressed={!micOn}
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
        aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
        aria-pressed={!cameraOn}
      />
      {shareSupported && (
        <IconButton
          icon={<ScreenShareIcon className="h-5.5 w-5.5" />}
          variant={sharing ? 'active' : 'default'}
          onClick={onToggleShare}
          aria-label={sharing ? 'Stop presenting' : 'Present now'}
          aria-pressed={sharing}
        />
      )}
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

export const ControlBar = memo(ControlBarComponent)
