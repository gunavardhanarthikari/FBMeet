import { memo, useEffect, useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { CopyLinkButton } from '@/components/ui/CopyLinkButton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { buildRoomUrl } from '@/lib/roomUrl'
import type { LiveKitConnectionState } from '@/contexts'

interface HeaderProps {
  roomId: string
  isHost: boolean
  connectionState?: LiveKitConnectionState
  justReconnected?: boolean
}

function HeaderComponent({ roomId, isHost, connectionState, justReconnected }: HeaderProps) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const clock = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <header
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-default px-4 pb-3 sm:px-6 sm:pb-4"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
        <Logo size="sm" />
        <span className="max-w-24 truncate font-mono text-xs tracking-widest text-text-muted sm:max-w-none">
          {roomId}
        </span>
        <CopyLinkButton text={buildRoomUrl(roomId)} />
      </div>

      <div className="flex shrink-0 items-center gap-4" aria-live="polite">
        {connectionState === 'reconnecting' && (
          <StatusBadge dot pulse className="text-xs text-leave-border">
            Reconnecting…
          </StatusBadge>
        )}
        {connectionState === 'connected' && justReconnected && (
          <StatusBadge dot className="text-xs text-text-title">
            Reconnected
          </StatusBadge>
        )}
        {connectionState === 'disconnected' && (
          <StatusBadge dot className="text-xs text-leave-border">
            Disconnected
          </StatusBadge>
        )}
        {isHost && (
          <StatusBadge dot className="text-xs text-text-title">
            Host
          </StatusBadge>
        )}
        <span className="font-mono text-xs text-text-muted">{clock}</span>
      </div>
    </header>
  )
}

export const Header = memo(HeaderComponent)
