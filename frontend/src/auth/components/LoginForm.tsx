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
    <form onSubmit={handleSubmit}>
      <h2>Entrar</h2>

      <label>
        Email
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={busy}
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
          required
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          disabled={busy}
        />
        Lembrar-me durante 14 dias
      </label>

      <button disabled={busy} type="submit">
        {busy ? 'A entrar...' : 'Entrar'}
      </button>
    </form>
  )
}