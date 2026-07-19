import { useEffect, useState } from 'react'
import { useLiveKit } from '@/contexts'
import type { UseLocalMediaResult } from '@/hooks/useLocalMedia'

interface DebugOverlayProps {
  media: UseLocalMediaResult
}

interface PolledStats {
  viewport: string
  online: boolean
  browser: string
}

function detectBrowserName(): string {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\//.test(ua)) return 'Opera'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari'
  return 'Unknown'
}

function readPolledStats(): PolledStats {
  return {
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    online: navigator.onLine,
    browser: detectBrowserName(),
  }
}

const POLL_INTERVAL_MS = 1000

/**
 * Dev-only diagnostics panel. Only ever mounted (see ControlBar/Call.tsx
 * callers) when both `import.meta.env.DEV` and `?debug=true` hold, so its
 * cost — polling, listeners, render — never reaches a production build or a
 * normal session. Read-only: it must never call anything that mutates
 * LiveKit/media state.
 */
export function DebugOverlay({ media }: DebugOverlayProps) {
  const liveKit = useLiveKit()
  const [stats, setStats] = useState<PolledStats>(readPolledStats)

  useEffect(() => {
    const id = setInterval(() => setStats(readPolledStats()), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const room = liveKit.room
  const publishedTracks = liveKit.localParticipant?.trackPublications.size ?? 0
  const subscribedTracks = Array.from(room?.remoteParticipants.values() ?? []).reduce(
    (total, participant) =>
      total +
      Array.from(participant.trackPublications.values()).filter((pub) => pub.isSubscribed).length,
    0,
  )
  const participantCount = liveKit.remoteParticipants.length + 1

  const rows: Array<[string, string]> = [
    ['Connection state', liveKit.connectionState],
    ['Room state', room?.state ?? 'n/a'],
    ['Participants', String(participantCount)],
    ['Published tracks', String(publishedTracks)],
    ['Subscribed tracks', String(subscribedTracks)],
    ['Camera', media.cameraOn ? 'on' : 'off'],
    ['Microphone', media.micOn ? 'on' : 'off'],
    ['Screen sharing', media.isSharing ? 'on' : 'off'],
    ['Active speaker', liveKit.activeRemoteSpeakerId ?? 'none'],
    ['Browser', stats.browser],
    ['Viewport', stats.viewport],
    ['Network', stats.online ? 'online' : 'offline'],
  ]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-4 left-4 z-[9999] w-60 rounded-md border border-white/15 bg-black/85 p-3 font-mono text-[11px] leading-relaxed text-lime-300"
      style={{
        marginBottom: 'env(safe-area-inset-bottom)',
        marginLeft: 'env(safe-area-inset-left)',
      }}
    >
      <div className="mb-1.5 text-[10px] tracking-[0.16em] text-white/50 uppercase">
        Debug overlay
      </div>
      <dl className="flex flex-col gap-0.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-white/50">{label}</dt>
            <dd className="truncate text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
