import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { SecondaryButton } from '@/components/ui/SecondaryButton'

interface LeaveCardProps {
  onRejoin: () => void
  onReturnHome: () => void
}

export function LeaveCard({ onRejoin, onReturnHome }: LeaveCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-6 font-mono text-xs tracking-[0.22em] text-accent-muted uppercase">
        The light closes behind them
      </span>

      <h1 className="font-display text-[clamp(40px,6vw,64px)] leading-[1.05] font-medium text-text-title">
        You left the room
      </h1>

      <p className="mt-3.5 max-w-105 font-body text-lg text-text-soft italic">
        The conversation is over, or paused. You can slip back in, or return to the front desk.
      </p>

      <div className="mt-16 flex flex-wrap items-center justify-center gap-3.5">
        <PrimaryButton onClick={onRejoin}>Rejoin</PrimaryButton>
        <SecondaryButton onClick={onReturnHome}>Return home</SecondaryButton>
      </div>
    </div>
  )
}
