import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type MediaStatus = 'idle' | 'requesting' | 'ready' | 'error' | 'unsupported'

export interface UseLocalMediaResult {
  stream: MediaStream | null
  status: MediaStatus
  cameraOn: boolean
  micOn: boolean
  cameraDenied: boolean
  micDenied: boolean
  isSupported: boolean
  message: string | null
  requestMedia: () => void
  toggleCamera: () => void
  toggleMic: () => void
  retry: () => void
}

function isMediaSupported() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  )
}

export function useLocalMedia(): UseLocalMediaResult {
  const [status, setStatus] = useState<MediaStatus>(() =>
    isMediaSupported() ? 'idle' : 'unsupported',
  )
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [cameraDenied, setCameraDenied] = useState(false)
  const [micDenied, setMicDenied] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  // Separate tokens per track kind: video and audio are acquired independently,
  // so one in-flight request must never be able to invalidate the other's.
  const videoTokenRef = useRef(0)
  const audioTokenRef = useRef(0)
  const mountedRef = useRef(true)

  const finalizeStatus = useCallback(() => {
    const hasLiveTrack = (streamRef.current?.getTracks().length ?? 0) > 0
    setStatus(hasLiveTrack ? 'ready' : 'error')
  }, [])

  const bindEndedHandler = useCallback((track: MediaStreamTrack, kind: 'video' | 'audio') => {
    track.addEventListener('ended', () => {
      if (!mountedRef.current) return
      streamRef.current?.removeTrack(track)
      if (kind === 'video') {
        setCameraOn(false)
        setCameraDenied(true)
      } else {
        setMicOn(false)
        setMicDenied(true)
      }
      finalizeStatus()
    })
  }, [finalizeStatus])

  const acquireVideo = useCallback(async () => {
    if (!isMediaSupported()) {
      setStatus('unsupported')
      return
    }
    const token = ++videoTokenRef.current
    setStatus('requesting')
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({ video: true })
      if (token !== videoTokenRef.current || !mountedRef.current) {
        acquired.getTracks().forEach((t) => t.stop())
        return
      }
      const [track] = acquired.getVideoTracks()
      bindEndedHandler(track, 'video')
      if (!streamRef.current) streamRef.current = new MediaStream()
      streamRef.current.addTrack(track)
      setStream(streamRef.current)
      setCameraDenied(false)
      setCameraOn(true)
    } catch {
      if (token !== videoTokenRef.current || !mountedRef.current) return
      setCameraDenied(true)
      setCameraOn(false)
    } finally {
      if (token === videoTokenRef.current && mountedRef.current) finalizeStatus()
    }
  }, [bindEndedHandler, finalizeStatus])

  const acquireAudio = useCallback(async () => {
    if (!isMediaSupported()) {
      setStatus('unsupported')
      return
    }
    const token = ++audioTokenRef.current
    setStatus('requesting')
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (token !== audioTokenRef.current || !mountedRef.current) {
        acquired.getTracks().forEach((t) => t.stop())
        return
      }
      const [track] = acquired.getAudioTracks()
      bindEndedHandler(track, 'audio')
      if (!streamRef.current) streamRef.current = new MediaStream()
      streamRef.current.addTrack(track)
      setStream(streamRef.current)
      setMicDenied(false)
      setMicOn(true)
    } catch {
      if (token !== audioTokenRef.current || !mountedRef.current) return
      setMicDenied(true)
      setMicOn(false)
    } finally {
      if (token === audioTokenRef.current && mountedRef.current) finalizeStatus()
    }
  }, [bindEndedHandler, finalizeStatus])

  // Cleanup: stop every track on unmount (leaving the Lobby, navigating away, refresh-in-SPA).
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  // Device changes (plug/unplug): a simple, crash-safe device-list refresh. No picker UI.
  useEffect(() => {
    if (!isMediaSupported() || !navigator.mediaDevices.addEventListener) return
    const handleDeviceChange = () => {
      navigator.mediaDevices.enumerateDevices().catch(() => {})
    }
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    return () => navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
  }, [])

  const toggleCamera = useCallback(() => {
    if (status === 'unsupported' || status === 'requesting') return
    const track = streamRef.current?.getVideoTracks()[0]
    if (track) {
      // Camera OFF fully releases the device (so the camera LED goes dark),
      // rather than merely disabling the track like the mic does.
      track.stop()
      streamRef.current?.removeTrack(track)
      setCameraOn(false)
      finalizeStatus()
      return
    }
    void acquireVideo()
  }, [status, acquireVideo, finalizeStatus])

  const toggleMic = useCallback(() => {
    if (status === 'unsupported' || status === 'requesting') return
    const track = streamRef.current?.getAudioTracks()[0]
    if (track) {
      const next = !track.enabled
      track.enabled = next
      setMicOn(next)
      return
    }
    void acquireAudio()
  }, [status, acquireAudio])

  const requestMedia = useCallback(() => {
    if (status === 'requesting' || status === 'ready') return
    if (!isMediaSupported()) {
      setStatus('unsupported')
      return
    }
    // Only acquire what the user currently intends (camera defaults off, mic defaults on),
    // so this is safe to call from any qualifying gesture without surprising the user.
    if (!streamRef.current?.getVideoTracks().length && cameraOn) void acquireVideo()
    if (!streamRef.current?.getAudioTracks().length && micOn) void acquireAudio()
  }, [status, cameraOn, micOn, acquireVideo, acquireAudio])

  const retry = useCallback(() => {
    if (!streamRef.current?.getVideoTracks().length) void acquireVideo()
    if (!streamRef.current?.getAudioTracks().length) void acquireAudio()
  }, [acquireVideo, acquireAudio])

  const message = useMemo(() => {
    if (status === 'unsupported') {
      return 'Camera and microphone preview aren’t supported in this browser.'
    }
    if (cameraDenied && micDenied) {
      return 'Camera and microphone access were denied — you can still join without them.'
    }
    if (micDenied) {
      return 'Microphone access was denied — you can still join without audio.'
    }
    if (cameraDenied) {
      return 'Camera access was denied.'
    }
    return null
  }, [status, cameraDenied, micDenied])

  return {
    stream,
    status,
    cameraOn,
    micOn,
    cameraDenied,
    micDenied,
    isSupported: status !== 'unsupported',
    message,
    requestMedia,
    toggleCamera,
    toggleMic,
    retry,
  }
}
