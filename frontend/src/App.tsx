import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { api, errorMessage } from './api'
import type { AppUser } from './api'


export default function App() {

  const [health, setHealth] = useState('A verificar a API...')
  const [user, setUser] = useState<AppUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  async function checkHealth() {
    setHealth('A verificar a API...')
    try {
      const response = await api.get<{
        application: string
        status: string
      }>('/api/health')
      setHealth(`${response.data.application}: ${response.data.status}`)
    } catch (error) {
      setHealth(errorMessage(error))
    }
  }

    useEffect(() => {
    let active = true

    api.get<{ application: string; status: string }>('/api/health')
      .then((response) => {
        if (!active) return
        setHealth(`${response.data.application}: ${response.data.status}`)
      })
      .catch((error: unknown) => {
        if (active) setHealth(errorMessage(error))
      })

    api.get<{ data: AppUser }>('/api/user')
      .then((response) => {
        if (!active) return
        setUser(response.data.data)
        setMessage('')
      })
      .catch((error: unknown) => {
        if (!active) return

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setUser(null)
        } else {
          setMessage(errorMessage(error))
        }
      })
      .finally(() => {
        if (active) setReady(true)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.post<{ data: AppUser }>('/login', {
        email,
        password,
      })
      setUser(response.data.data)
      setPassword('')
      setMessage('Login efetuado.')
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    setBusy(true)
    setMessage('')
    try {
      await api.get('/sanctum/csrf-cookie')
      await api.post('/logout')
      setUser(null)
      setMessage('Sessão terminada.')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setUser(null)
        setMessage('A sessão já terminou.')
      } else {
        setMessage(errorMessage(error))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>CleanCheck</h1>
      <section>
        <h2>Ligação à API</h2>
        <p role="status">{health}</p>
        <button onClick={() => void checkHealth()}>
          Verificar ligação
        </button>
      </section>
      <hr />
      {!ready ? (
        <p>A verificar a sessão...</p>
      ) : user ? (
        <section>
          <h2>Olá, {user.name}</h2>
          <p>{user.email}</p>
          <p>Perfil: {user.role}</p>
          <button disabled={busy} onClick={() => void handleLogout()}>
            {busy ? 'A terminar...' : 'Sair'}
          </button>
        </section>
      ) : (
        <form onSubmit={handleLogin}>
          <h2>Entrar</h2>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              required
            />
          </label>
          <button disabled={busy} type="submit">
            {busy ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </main>
  )
}