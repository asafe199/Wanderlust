import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconClose, IconImage } from './ui'
import { readImageCompressed } from '../lib/storage'

type Facing = 'user' | 'environment'

/**
 * Live camera capture with a file-picker fallback for devices (or permissions)
 * where getUserMedia is unavailable. Produces a compressed data URL; the caller
 * decides what to do with it — nothing is persisted here.
 */
export default function CameraCapture({
  facing,
  label,
  hint,
  value,
  onCapture,
  frame = 'square',
}: {
  facing: Facing
  label: string
  hint: string
  value: string | null
  onCapture: (dataUrl: string | null) => void
  frame?: 'square' | 'card' | 'portrait'
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [live, setLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setLive(false)
  }

  useEffect(() => stop, [])

  const start = async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('No camera here — upload a photo instead.')
      fileRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      setLive(true)
      // The <video> only exists once `live` flips, so attach on the next frame.
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      }, 0)
    } catch {
      setError('Camera blocked — upload a photo instead.')
    }
  }

  const shoot = () => {
    const video = videoRef.current
    if (!video) return
    const maxEdge = 1000
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (facing === 'user') {
      // Mirror the selfie back so it matches what the user saw on screen.
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    onCapture(canvas.toDataURL('image/jpeg', 0.78))
    stop()
  }

  const pickFile = async (file?: File) => {
    if (!file) return
    try {
      onCapture(await readImageCompressed(file, 1000, 0.78))
      setError(null)
    } catch {
      setError('Could not read that image.')
    }
  }

  const ratio = frame === 'card' ? '3 / 2' : frame === 'portrait' ? '9 / 10' : '1 / 1'

  return (
    <div className="col" style={{ gap: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ font: '700 15px/1 var(--sans)' }}>{label}</span>
        {value && (
          <span className="meta" style={{ color: 'var(--success-fg)' }}>
            CAPTURED
          </span>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          aspectRatio: ratio,
          borderRadius: 22,
          overflow: 'hidden',
          background: 'var(--field)',
          border: value ? 'none' : '2px dashed var(--line-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value ? (
          <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : live ? (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: facing === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />
        ) : (
          <div className="col" style={{ alignItems: 'center', gap: 8, color: 'var(--muted)', padding: 16 }}>
            <IconImage size={22} />
            <span style={{ font: '600 13px/1.3 var(--sans)', color: 'var(--ink)', textAlign: 'center' }}>
              {hint}
            </span>
            <span className="meta">NOT STORED AFTER REVIEW</span>
          </div>
        )}

        {live && (
          <button
            onClick={shoot}
            aria-label={`Take ${label.toLowerCase()}`}
            style={{
              position: 'absolute',
              bottom: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 62,
              height: 62,
              borderRadius: 999,
              border: '4px solid rgba(255,255,255,.9)',
              background: 'var(--action)',
              boxShadow: '0 8px 20px rgba(0,0,0,.35)',
            }}
          />
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture={facing}
        hidden
        onChange={(e) => pickFile(e.target.files?.[0])}
      />

      <div className="row" style={{ gap: 8 }}>
        {value ? (
          <>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, height: 46, fontSize: 14 }}
              onClick={() => {
                onCapture(null)
                start()
              }}
            >
              <IconClose size={16} /> Retake
            </button>
            <span
              className="pill flat"
              style={{ height: 46, color: 'var(--success-fg)', flex: 'none' }}
            >
              <IconCheck size={16} /> Looks good
            </span>
          </>
        ) : live ? (
          <button className="btn btn-ghost btn-block" style={{ height: 46, fontSize: 14 }} onClick={stop}>
            Cancel
          </button>
        ) : (
          <>
            <button className="btn btn-ink" style={{ flex: 1, height: 46, fontSize: 14 }} onClick={start}>
              Open camera
            </button>
            <button
              className="btn btn-ghost"
              style={{ flex: 'none', height: 46, fontSize: 14, padding: '0 18px' }}
              onClick={() => fileRef.current?.click()}
            >
              Upload
            </button>
          </>
        )}
      </div>

      {error && <span className="error-text">{error}</span>}
    </div>
  )
}
