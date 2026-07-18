import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { SecondaryButton } from '@/components/ui/SecondaryButton'

interface ScreenShareDialogProps {
  onConfirm: () => void
  onCancel: () => void
  fast?: boolean
}

export function ScreenShareDialog({ onConfirm, onCancel, fast = false }: ScreenShareDialogProps) {
  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-scrim p-6">
      <div
        className={`w-[min(400px,92vw)] rounded-md border border-border-emphasis bg-surface-card p-8 text-center shadow-lg md:p-16 ${
          fast ? 'animate-mood-fade-fast' : 'animate-mood-fade'
        }`}
      >
        <h2 className="font-display text-3xl font-medium text-text-title">
          Share your screen?
        </h2>
        <p className="mt-2.5 font-body text-lg text-text-soft italic">
          Everyone in the room will see what you choose to present.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <SecondaryButton onClick={onCancel}>No</SecondaryButton>
          <PrimaryButton onClick={onConfirm}>Yes</PrimaryButton>
        </div>
      </div>
    </div>
  )
}
