import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { SecondaryButton } from '@/components/ui/SecondaryButton'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FBMeet crashed:', error, info.componentStack)
  }

  handleReload = () => {
    // A full reload, not a client-side navigation — the component tree that
    // crashed may be holding onto broken state (e.g. a torn-down LiveKit
    // room or hardware track), so a fresh document load is the safe recovery.
    window.location.reload()
  }

  handleReturnHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="animate-mood-fade flex min-h-screen flex-col items-center justify-center p-8 text-center md:p-16">
          <Logo className="mb-9" />
          <span className="mb-6 font-mono text-xs tracking-[0.22em] text-accent-muted uppercase">
            Something interrupted the room
          </span>
          <h1 className="font-display text-[clamp(32px,5vw,48px)] leading-[1.05] font-medium text-text-title">
            Something went wrong
          </h1>
          <p className="mt-3.5 max-w-105 font-body text-lg text-text-soft italic">
            FBMeet ran into an unexpected error. Reloading usually clears it up — your meeting
            link still works.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3.5">
            <PrimaryButton onClick={this.handleReload}>Reload</PrimaryButton>
            <SecondaryButton onClick={this.handleReturnHome}>Return home</SecondaryButton>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
