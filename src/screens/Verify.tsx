import { useState } from 'react'
import { useApp } from '../store'
import CameraCapture from '../components/CameraCapture'
import { IconBack, IconCheck, StatusBar } from '../components/ui'
import { DOCUMENT_LABEL, type DocumentKind } from '../lib/types'
import { longDate } from '../lib/format'

const STEPS = ['Selfie', 'Document', 'Face + doc', 'Review'] as const

export default function Verify() {
  const { user, back, navigate, submitVerification, showToast } = useApp()
  const [step, setStep] = useState(0)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [documentKind, setDocumentKind] = useState<DocumentKind>('id')
  const [documentShot, setDocumentShot] = useState<string | null>(null)
  const [holdingShot, setHoldingShot] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!user) {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="VERIFY" />
        <div className="pad" style={{ paddingTop: 24 }}>
          <p className="body-text">Log in to verify your identity.</p>
          <button className="btn btn-primary btn-block" onClick={() => navigate({ name: 'login' })}>
            Log in
          </button>
        </div>
      </div>
    )
  }

  const { verification } = user

  /* Already cleared — nothing to do here. */
  if (verification.status === 'verified') {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="VERIFIED" />
        <div className="row" style={{ padding: '4px 16px 12px', gap: 12 }}>
          <button className="iconbtn" onClick={back} aria-label="Go back">
            <IconBack />
          </button>
          <span style={{ font: '700 17px/1 var(--sans)' }}>Identity</span>
        </div>
        <div className="body pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Badge tone="var(--success)" label="You're verified" />
          <div className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="body-text">Document</span>
              <span style={{ font: '600 13px/1 var(--sans)' }}>
                {verification.documentKind ? DOCUMENT_LABEL[verification.documentKind] : '—'}
              </span>
            </div>
            {verification.reviewedAt && (
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="body-text">Cleared</span>
                <span style={{ font: '600 13px/1 var(--sans)' }}>{longDate(verification.reviewedAt)}</span>
              </div>
            )}
            {verification.reference && (
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="body-text">Reference</span>
                <span className="mono" style={{ fontSize: 12 }}>
                  {verification.reference}
                </span>
              </div>
            )}
            <span className="meta" style={{ marginTop: 4 }}>
              YOUR PHOTOS WERE NOT KEPT ON THIS DEVICE
            </span>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => navigate({ name: 'create' }, { replace: true })}>
            Create an event
          </button>
        </div>
      </div>
    )
  }

  /* Submitted and waiting on review. */
  if (verification.status === 'pending') {
    return (
      <div className="screen" style={{ background: 'var(--canvas)' }}>
        <StatusBar label="IN REVIEW" />
        <div className="body pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 40 }}>
          <Badge tone="var(--action)" label="Checking your documents" pulsing />
          <p className="body-text">
            This usually takes a few seconds. You can keep browsing — we&apos;ll unlock hosting as
            soon as it clears.
          </p>
          <button className="btn btn-ghost btn-block" onClick={() => navigate({ name: 'map' }, { reset: true })}>
            Back to the map
          </button>
        </div>
      </div>
    )
  }

  const submit = async () => {
    if (!selfie) {
      setStep(0)
      return setError('We need a photo of you.')
    }
    if (!documentShot) {
      setStep(1)
      return setError(`We need a photo of your ${DOCUMENT_LABEL[documentKind].toLowerCase()}.`)
    }
    if (!holdingShot) {
      setStep(2)
      return setError('We need a photo of you holding the document.')
    }
    setBusy(true)
    try {
      await submitVerification(documentKind)
      showToast('Verified — hosting unlocked')
      navigate({ name: 'create' }, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit right now')
    } finally {
      setBusy(false)
    }
  }

  const next = () => {
    if (step === 0 && !selfie) return setError('Take a photo of yourself to continue.')
    if (step === 1 && !documentShot)
      return setError(`Take a photo of your ${DOCUMENT_LABEL[documentKind].toLowerCase()}.`)
    if (step === 2 && !holdingShot)
      return setError('Take a photo of yourself holding the document.')
    setError(null)
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="VERIFY" />

      <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 14 }}>
        <div className="row" style={{ gap: 12 }}>
          <button
            className="iconbtn"
            onClick={() => (step === 0 ? back() : setStep((s) => s - 1))}
            aria-label="Go back"
          >
            <IconBack />
          </button>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: '700 16px/1 var(--sans)' }}>{STEPS[step]}</span>
            <span className="meta">
              STEP {step + 1} OF {STEPS.length}
            </span>
          </div>
        </div>
        <div className="progress">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'on' : undefined} />
          ))}
        </div>
      </div>

      <div
        className="body pad"
        style={{ paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        {step === 0 && (
          <>
            <div className="col" style={{ gap: 6 }}>
              <h2 className="title" style={{ fontSize: 26 }}>
                Verify it&apos;s you.
              </h2>
              <p className="body-text">
                Hosting means taking other people&apos;s money, so we check who you are first. Three
                photos, once — then your account can publish events forever.
              </p>
            </div>
            <CameraCapture
              facing="user"
              label="Photo of you"
              hint="Face the camera in good light, no hat or sunglasses"
              value={selfie}
              onCapture={(shot) => {
                setSelfie(shot)
                setError(null)
              }}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div className="col" style={{ gap: 8 }}>
              <span style={{ font: '700 15px/1 var(--sans)' }}>Which document?</span>
              <div className="row" style={{ gap: 8 }}>
                {(['id', 'license'] as DocumentKind[]).map((kind) => (
                  <button
                    key={kind}
                    className={`pill${documentKind === kind ? ' active' : ''}`}
                    style={{ height: 40 }}
                    onClick={() => {
                      setDocumentKind(kind)
                      setDocumentShot(null)
                      setHoldingShot(null)
                      setError(null)
                    }}
                    aria-pressed={documentKind === kind}
                  >
                    {DOCUMENT_LABEL[kind]}
                  </button>
                ))}
              </div>
            </div>
            <CameraCapture
              facing="environment"
              frame="card"
              label={`Photo of your ${DOCUMENT_LABEL[documentKind].toLowerCase()}`}
              hint="Lay it flat, fill the frame, keep every corner visible"
              value={documentShot}
              onCapture={(shot) => {
                setDocumentShot(shot)
                setError(null)
              }}
            />
            <span className="meta">
              THE NAME ON THE DOCUMENT MUST MATCH {user.name.toUpperCase()}
            </span>
          </>
        )}

        {step === 2 && (
          <>
            <div className="col" style={{ gap: 6 }}>
              <h2 className="title" style={{ fontSize: 26 }}>
                Now both together.
              </h2>
              <p className="body-text">
                Hold your {DOCUMENT_LABEL[documentKind].toLowerCase()} up next to your face. This is
                what proves the document is yours and not a photo of someone else&apos;s.
              </p>
            </div>
            <CameraCapture
              facing="user"
              frame="portrait"
              label={`You holding your ${DOCUMENT_LABEL[documentKind].toLowerCase()}`}
              hint="Document beside your cheek, both faces readable, nothing covered by your fingers"
              value={holdingShot}
              onCapture={(shot) => {
                setHoldingShot(shot)
                setError(null)
              }}
            />
          </>
        )}

        {step === 3 && (
          <>
            <div className="col" style={{ gap: 6 }}>
              <h2 className="title" style={{ fontSize: 26 }}>
                Ready to send.
              </h2>
              <p className="body-text">
                All three photos go to our verification provider. They are not saved on this device
                and never appear on your public profile.
              </p>
            </div>
            <div className="row" style={{ gap: 10, alignItems: 'stretch' }}>
              <Thumb src={selfie} caption="YOU" />
              <Thumb src={documentShot} caption={DOCUMENT_LABEL[documentKind].toUpperCase()} />
              <Thumb src={holdingShot} caption="TOGETHER" />
            </div>
            <div className="card card-lg" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="body-text">Name on account</span>
                <span style={{ font: '600 13px/1 var(--sans)' }}>{user.name}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="body-text">Document</span>
                <span style={{ font: '600 13px/1 var(--sans)' }}>{DOCUMENT_LABEL[documentKind]}</span>
              </div>
            </div>
            <span className="body-text" style={{ color: 'var(--faint)', fontSize: 12 }}>
              Demo build — the review is simulated and always approves. Wire this screen to a real
              KYC provider before going live; documents must never be stored client-side.
            </span>
          </>
        )}

        {error && <span className="error-text">{error}</span>}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 'calc(26px + var(--safe-bottom))',
        }}
      >
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary btn-block" onClick={next}>
            Continue
          </button>
        ) : (
          <button className="btn btn-primary btn-block" onClick={submit} disabled={busy}>
            {busy ? 'Sending…' : 'Submit for verification'}
          </button>
        )}
      </div>
    </div>
  )
}

function Badge({ tone, label, pulsing }: { tone: string; label: string; pulsing?: boolean }) {
  return (
    <div className="col" style={{ alignItems: 'center', gap: 12, textAlign: 'center' }}>
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 999,
          background: tone,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: pulsing ? 'screenIn 1.2s ease-in-out infinite alternate' : undefined,
        }}
      >
        <IconCheck size={28} />
      </div>
      <h2 className="title" style={{ fontSize: 26 }}>
        {label}
      </h2>
    </div>
  )
}

function Thumb({ src, caption }: { src: string | null; caption: string }) {
  return (
    <div className="col" style={{ flex: 1, gap: 6 }}>
      <div
        style={{
          aspectRatio: '1',
          borderRadius: 18,
          overflow: 'hidden',
          background: 'var(--field)',
        }}
      >
        {src && <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <span className="meta">{caption}</span>
    </div>
  )
}
