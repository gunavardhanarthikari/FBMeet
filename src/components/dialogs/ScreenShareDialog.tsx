import { useEffect, useRef } from 'react'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { SecondaryButton } from '@/components/ui/SecondaryButton'

interface ScreenShareDialogProps {
  onConfirm: () => void
  onCancel: () => void
  fast?: boolean
}

export function ScreenShareDialog({ onConfirm, onCancel, fast = false }: ScreenShareDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-scrim p-6"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="screen-share-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-[min(400px,92vw)] rounded-md border border-border-emphasis bg-surface-card p-8 text-center shadow-lg md:p-16 ${
          fast ? 'animate-mood-fade-fast' : 'animate-mood-fade'
        }`}
      >
        <h2 id="screen-share-dialog-title" className="font-display text-3xl font-medium text-text-title">
          Share your screen?
        </h2>
        <p className="mt-2.5 font-body text-lg text-text-soft italic">
          Everyone in the room will see what you choose to present. Pick a screen, window, or tab
          next, and stop anytime from the controls below.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <SecondaryButton onClick={onCancel}>No</SecondaryButton>
          <PrimaryButton ref={confirmButtonRef} onClick={onConfirm}>
            Yes
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
