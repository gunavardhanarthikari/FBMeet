import { useCallback, useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '@/lib/clipboard'

type CopyStatus = 'idle' | 'copied' | 'failed'

interface CopyLinkButtonProps {
  text: string
  autoTrigger?: boolean
  className?: string
}

export function CopyLinkButton({ text, autoTrigger = false, className = '' }: CopyLinkButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const fallbackInputRef = useRef<HTMLInputElement>(null)

  const attemptCopy = useCallback(async () => {
    const ok = await copyToClipboard(text)
    setStatus(ok ? 'copied' : 'failed')
    if (ok) {
      setTimeout(() => setStatus('idle'), 1800)
    }
  }, [text])

  useEffect(() => {
    if (autoTrigger) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot copy triggered by mount, not by React state
      void attemptCopy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrigger])

  useEffect(() => {
    if (status === 'failed') {
      fallbackInputRef.current?.select()
    }
  }, [status])

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={attemptCopy}
        className={`rounded-sm border border-border-emphasis bg-transparent px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] uppercase transition-colors duration-300 ease-out-soft ${
          status === 'copied' ? 'text-text-title' : 'text-text-muted'
        } ${className}`}
      >
        {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : 'Copy link'}
      </button>

      {status === 'failed' && (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] text-text-muted">
            Couldn't copy automatically — select and copy manually:
          </span>
          <input
            ref={fallbackInputRef}
            readOnly
            value={text}
            onFocus={(e) => e.currentTarget.select()}
            className="rounded-sm border border-border-emphasis bg-surface-sunken px-2 py-1 font-mono text-[11px] text-text-body"
          />
        </div>
      )}
    </div>
  )
}
