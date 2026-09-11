import { useState } from 'react'
import { useApp } from '../store'
import { IconBack, StatusBar } from '../components/ui'
import { DEMO_USER } from '../lib/seed'

export function Login() {
  const { login, navigate, back, canGoBack, showToast } = useApp()
  const [email, setEmail] = useState(DEMO_USER.email)
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = login(email, password)
    if (!result.ok) {
      setError(result.error ?? 'Could not log in.')
      return
    }
    showToast('Welcome back')
    navigate({ name: 'map' }, { reset: true })
  }

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="WANDERLUST" />
      <div className="body pad" style={{ paddingBottom: 40 }}>
        <button
          className="iconbtn"
          onClick={() => (canGoBack ? back() : navigate({ name: 'map' }, { reset: true }))}
          aria-label="Go back"
        >
          <IconBack />
        </button>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 28 }}>
          <h2 className="title">
            Welcome
            <br />
            back.
          </h2>

          <div className="col" style={{ gap: 12 }}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className={`input${error ? ' invalid' : ''}`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                placeholder="you@email.com"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  className={`input${error ? ' invalid' : ''}`}
                  type={reveal ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  placeholder="••••••••"
                  style={{ paddingRight: 68 }}
                />
                <button
                  type="button"
                  className="mono"
                  onClick={() => setReveal((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: 0,
                    height: 54,
                    border: 'none',
                    background: 'none',
                    color: 'var(--action-text)',
                    font: '500 11px/1 var(--mono)',
                  }}
                >
                  {reveal ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              {error && <span className="error-text">{error}</span>}
            </div>
            <button
              type="button"
              onClick={() => showToast('Reset link sent — check your inbox')}
              style={{
                alignSelf: 'flex-end',
                border: 'none',
                background: 'none',
                font: '600 13px/1 var(--sans)',
                color: 'var(--muted)',
              }}
            >
              Forgot password?
            </button>
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            Log in
          </button>

          <div className="row" style={{ gap: 12 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span className="mono" style={{ font: '500 10px/1 var(--mono)', color: 'var(--faint)' }}>
              OR
            </span>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          <div className="col" style={{ gap: 10 }}>
            <button
              type="button"
              className="btn btn-block"
              style={{ background: 'var(--surface)', boxShadow: 'var(--e-rest)', height: 54, fontSize: 15 }}
              onClick={() => showToast('Social sign-in needs a provider key')}
            >
              Continue with Google
            </button>
            <button
              type="button"
              className="btn btn-ink btn-block"
              style={{ height: 54, fontSize: 15 }}
              onClick={() => showToast('Social sign-in needs a provider key')}
            >
              Continue with Apple
            </button>
          </div>

          <div
            className="card"
            style={{ padding: 14, font: '400 12px/1.5 var(--sans)', color: 'var(--muted)' }}
          >
            Demo account —{' '}
            <span className="mono" style={{ color: 'var(--ink)' }}>
              {DEMO_USER.email}
            </span>{' '}
            /{' '}
            <span className="mono" style={{ color: 'var(--ink)' }}>
              {DEMO_USER.password}
            </span>
          </div>

          <div style={{ textAlign: 'center', font: '400 13px/1.5 var(--sans)', color: 'var(--muted)' }}>
            New here?{' '}
            <button
              type="button"
              onClick={() => navigate({ name: 'signup' })}
              style={{
                border: 'none',
                background: 'none',
                font: '700 13px/1.5 var(--sans)',
                color: 'var(--action-text)',
                padding: 0,
              }}
            >
              Create an account
            </button>{' '}
            — same account hosts events.
          </div>
        </form>
      </div>
    </div>
  )
}

export function Signup() {
  const { signup, navigate, back, showToast } = useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Tell us your name.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('That email looks off.')
    if (password.length < 6) return setError('Use at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    if (!accepted) return setError('Accept the terms to continue.')
    const result = signup(name, email, password)
    if (!result.ok) return setError(result.error ?? 'Could not create the account.')
    showToast('Account created')
    navigate({ name: 'map' }, { reset: true })
  }

  return (
    <div className="screen" style={{ background: 'var(--canvas)' }}>
      <StatusBar label="NEW ACCOUNT" />
      <div className="body pad" style={{ paddingBottom: 40 }}>
        <button className="iconbtn" onClick={back} aria-label="Go back">
          <IconBack />
        </button>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 28 }}>
          <h2 className="title">
            Create your
            <br />
            account.
          </h2>
          <div className="col" style={{ gap: 12 }}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mel Okafor"
              />
            </div>
            <div className="field">
              <label htmlFor="su-email">Email</label>
              <input
                id="su-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>
            <div className="field">
              <label htmlFor="su-pass">Password</label>
              <input
                id="su-pass"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="field">
              <label htmlFor="su-confirm">Confirm password</label>
              <input
                id="su-confirm"
                className="input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>

          <label className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{
                width: 22,
                height: 22,
                marginTop: 2,
                accentColor: 'var(--action)',
                appearance: 'auto',
              }}
            />
            <span style={{ font: '400 13px/1.45 var(--sans)', color: 'var(--muted)' }}>
              I accept the terms of use and the privacy policy. The same account lets me host
              events.
            </span>
          </label>

          {error && <span className="error-text">{error}</span>}

          <button className="btn btn-primary btn-block" type="submit">
            Create account
          </button>
        </form>
      </div>
    </div>
  )
}
