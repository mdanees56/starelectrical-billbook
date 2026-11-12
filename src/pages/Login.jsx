import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { cloudEnabled, sendPasswordReset, signInToCloud, signUpForCloud } from '../services/supabase'
import './Login.css'

export default function Login({ settings }) {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const navigate = useNavigate()

  if (cloudEnabled) return <CloudLogin settings={settings} />
  if (!settings.pin) return <Navigate to="/" replace />

  const submit = event => {
    event.preventDefault()
    if (pin === settings.pin) {
      sessionStorage.setItem('seh-unlocked', 'yes')
      navigate('/')
    } else {
      alert('Incorrect PIN. Please try again.')
    }
  }

  return (
    <main className="login">
      <div className="login-card">
        <div className="star">★</div>
        <h1>{settings.name}</h1>
        <p>Secure local billing workspace</p>
        <form onSubmit={submit}>
          <label>
            Enter local PIN
            <span className="password-field">
              <input
                autoFocus
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength="8"
                value={pin}
                onChange={event => setPin(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                aria-pressed={showPin}
                onClick={() => setShowPin(visible => !visible)}
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <button>Unlock shop</button>
        </form>
      </div>
    </main>
  )
}

function CloudLogin({ settings }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      if (creating) {
        const data = await signUpForCloud(email, password)
        setMessage(data.session ? 'Account created. Signing in…' : 'Account created. Confirm the email, then sign in.')
        if (data.session) window.location.replace('/')
      } else {
        await signInToCloud(email, password)
        window.location.replace('/')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async () => {
    try {
      await sendPasswordReset(email)
      setMessage('Password-reset link sent. Check your email.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <main className="login">
      <div className="login-card">
        <div className="star">★</div>
        <h1>{settings.name}</h1>
        <p>Sign in with the same shop account on every device to share inventory.</p>
        <form onSubmit={submit}>
          <label>
            Shop email
            <input
              autoFocus
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                minLength="6"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(visible => !visible)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {message && <p className="login-message">{message}</p>}
          <button disabled={busy}>
            {busy ? 'Please wait…' : creating ? 'Create shop account' : 'Sign in to shop'}
          </button>
        </form>
        <button
          type="button"
          className="login-switch"
          onClick={() => {
            setCreating(!creating)
            setMessage('')
          }}
        >
          {creating ? 'Already have an account? Sign in' : 'First device? Create the shop account'}
        </button>
        {!creating && (
          <button type="button" className="link login-switch" onClick={resetPassword}>
            Forgot password?
          </button>
        )}
      </div>
    </main>
  )
}
