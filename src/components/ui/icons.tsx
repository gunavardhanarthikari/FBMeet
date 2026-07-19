import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="6" width="13" height="12" rx="2" />
      <path d="M15.5 10.5 21 7v10l-5.5-3.5z" />
    </svg>
  )
}

export function CameraOffIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15.5 10.5 21 7v10l-5.5-3.5z" />
      <path d="M2.5 6h9.5a2 2 0 0 1 2 2v.5" />
      <path d="M15.5 18H4.5a2 2 0 0 1-2-2V8" />
      <path d="M2 2l20 20" />
    </svg>
  )
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5v4" />
      <path d="M8.5 21.5h7" />
    </svg>
  )
}

export function MicOffIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 6.5a3 3 0 0 1 6 0V11" />
      <path d="M5.5 11a6.5 6.5 0 0 0 9.5 5.8" />
      <path d="M18.5 11a6.5 6.5 0 0 1-1.1 3.6" />
      <path d="M12 17.5v4" />
      <path d="M8.5 21.5h7" />
      <path d="M2 2l20 20" />
    </svg>
  )
}

export function ScreenShareIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="3.5" width="19" height="13" rx="1.5" />
      <path d="M8 21h8" />
      <path d="M12 16.5V21" />
      <path d="M12 6v6" />
      <path d="M9 9l3-3 3 3" />
    </svg>
  )
}

export function HangUpIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 13.5c1.8-3.2 5-5 8.5-5s6.7 1.8 8.5 5" />
      <path d="M7 13l1.5 2.5c1-.6 2.2-1 3.5-1s2.5.4 3.5 1L17 13" />
      <path d="M3 3l18 18" />
    </svg>
  )
}

export function SpeakerMutedIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 9.5v5h4l5.5 4.5v-14L7.5 9.5h-4z" />
      <path d="M16 9l5 6" />
      <path d="M21 9l-5 6" />
    </svg>
  )
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  )
}
