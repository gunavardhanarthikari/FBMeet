import { useMemo, useState, type ReactNode } from 'react'
import { MeetingContext } from './MeetingContext'

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState('')
  const [joined, setJoined] = useState(false)

  const value = useMemo(
    () => ({ displayName, setDisplayName, joined, setJoined }),
    [displayName, joined],
  )

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
}
