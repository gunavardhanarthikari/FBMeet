import { createContext, useContext } from 'react'

export interface MeetingContextValue {
  displayName: string
  setDisplayName: (name: string) => void
  joined: boolean
  setJoined: (joined: boolean) => void
}

export const MeetingContext = createContext<MeetingContextValue | null>(null)

export function useMeeting() {
  const ctx = useContext(MeetingContext)
  if (!ctx) {
    throw new Error('useMeeting must be used within a MeetingProvider')
  }
  return ctx
}
