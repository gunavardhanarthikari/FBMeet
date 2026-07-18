import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/call/Header'
import { ControlBar } from '@/components/call/ControlBar'
import { ParticipantTile } from '@/components/call/ParticipantTile'
import { ScreenShareDialog } from '@/components/dialogs/ScreenShareDialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { mockParticipants } from '@/lib/mockParticipants'
import { useMeeting } from '@/contexts'

interface CallProps {
  roomId: string
  isHost: boolean
}

export function Call({ roomId, isHost }: CallProps) {
  const navigate = useNavigate()
  const { displayName, setJoined } = useMeeting()

  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [showShareConfirm, setShowShareConfirm] = useState(false)

  const participants = useMemo(
    () =>
      mockParticipants.map((p) =>
        p.isSelf
          ? { ...p, name: displayName || p.name, micMuted: !micOn, cameraOff: !cameraOn, isHost }
          : p,
      ),
    [displayName, micOn, cameraOn, isHost],
  )

  const maxColumns = Math.min(4, Math.ceil(Math.sqrt(participants.length)))
  const gridVars = {
    '--cols-base': Math.min(2, participants.length),
    '--cols-sm': Math.min(3, maxColumns),
    '--cols-lg': maxColumns,
  } as CSSProperties

  function handleToggleShare() {
    if (sharing) {
      console.log('stop sharing')
      setSharing(false)
    } else {
      setShowShareConfirm(true)
    }
  }

  function handleConfirmShare() {
    console.log('start sharing')
    setSharing(true)
    setShowShareConfirm(false)
  }

  function handleLeave() {
    console.log('leave call')
    setJoined(false)
    navigate('/left', { state: { roomId } })
  }

  return (
    <div className="animate-mood-fade flex min-h-screen flex-col">
      <Header roomId={roomId} isHost={isHost} />

      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
        {sharing && (
          <div className="shadow-share-frame relative flex-1 overflow-hidden rounded-md border border-border-accent bg-black">
            <div className="flex h-full w-full items-center justify-center font-mono text-xs text-white/60">
              Screen share preview
            </div>
            <StatusBadge dot pulse variant="pill" className="absolute top-2 left-2">
              You are presenting
            </StatusBadge>
          </div>
        )}

        <div
          className={
            sharing
              ? 'grid auto-cols-52.5 grid-flow-col gap-3.5 overflow-x-auto'
              : 'grid flex-1 content-center gap-3.5 overflow-auto grid-cols-[repeat(var(--cols-base),1fr)] sm:grid-cols-[repeat(var(--cols-sm),1fr)] lg:grid-cols-[repeat(var(--cols-lg),1fr)]'
          }
          style={sharing ? undefined : gridVars}
        >
          {participants.map((p) => (
            <ParticipantTile key={p.id} participant={p} isHostView={isHost} />
          ))}
        </div>
      </div>

      <ControlBar
        micOn={micOn}
        cameraOn={cameraOn}
        sharing={sharing}
        onToggleMic={() => setMicOn((v) => !v)}
        onToggleCamera={() => setCameraOn((v) => !v)}
        onToggleShare={handleToggleShare}
        onLeave={handleLeave}
      />

      {showShareConfirm && (
        <ScreenShareDialog
          fast
          onConfirm={handleConfirmShare}
          onCancel={() => setShowShareConfirm(false)}
        />
      )}
    </div>
  )
}
