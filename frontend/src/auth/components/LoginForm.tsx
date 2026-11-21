import { useState } from 'react'
import type { FormEvent } from 'react'
import type { LoginCredentials } from '../hooks/useAuth'

type LoginFormProps = {
  busy: boolean
  onLogin: (credentials: LoginCredentials) => Promise<boolean>
}

export function LoginForm({ busy, onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const success = await onLogin({
      email,
      password,
      remember,
    })

    if (success) {
      setPassword('')
    }
  }

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <img
        className="login-logo"
        src="/cleancheck-logo.svg"
        alt="CleanCheck"
      />

      <h2 className="login-title">Entrar</h2>

      <label className="login-label">
        Email
        <input
          className="login-input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={busy}
          required
        />
      </label>

      <label className="login-label">
        Password
        <input
          className="login-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
          required
        />
      </label>

      <label className="login-checkbox-label">
        <input
          className="login-checkbox"
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          disabled={busy}
        />
        <span>Lembrar-me durante 14 dias</span>
      </label>

      <button
        className="login-button"
        disabled={busy}
        type="submit"
      >
        {busy ? 'A entrar...' : 'Entrar'}
      </button>
    </form>
  )
}