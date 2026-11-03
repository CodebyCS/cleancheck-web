import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { api, errorMessage } from '../../api'
import type { AppUser } from '../../api'


export type LoginCredentials = {
  email: string
  password: string
  remember: boolean
}

type AuthResponse = {
  data: AppUser
  meta: {
    expires_at: string
  }
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  const handleSessionExpired = useCallback(() => {
  setUser(null)
  setExpiresAt(null)
  setMessage('A sessão terminou. Inicia sessão novamente.')
}, [])

  useEffect(() => {
    let active = true

    api.get<AuthResponse>('/api/user')
      .then((response) => {
        if (!active) return
        const deadline = Date.parse(response.data.meta.expires_at)

      if (!Number.isFinite(deadline) || deadline <= Date.now()) {
        throw new Error('A sessão recebida não tem um prazo válido.')
      }

      setExpiresAt(deadline)
      setUser(response.data.data)
        setMessage('')
      })
      .catch((error: unknown) => {
        if (!active) return

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setUser(null)
          setExpiresAt(null)
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

  useEffect(() => {
    if (expiresAt === null) return

    function expireSession() {
      setUser(null)
      setExpiresAt(null)
      setMessage('A sessão expirou. Inicia sessão novamente.')
    }

    function checkExpiration() {
      if (expiresAt !== null && Date.now() >= expiresAt) {
        expireSession()
      }
    }

    const timer = window.setTimeout(
      expireSession,
      Math.max(0, expiresAt - Date.now()),
    )

    window.addEventListener('focus', checkExpiration)
    document.addEventListener('visibilitychange', checkExpiration)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', checkExpiration)
      document.removeEventListener('visibilitychange', checkExpiration)
    }
  }, [expiresAt])

  useEffect(() => {
    if (user === null) return

    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status

          if (status === 401) {
            setUser(null)
            setExpiresAt(null)
            setMessage('A sessão terminou. Inicia sessão novamente.')
          } else if (status === 403) {
            setMessage('Não tens permissão para realizar esta operação.')
          }
        }

        return Promise.reject(error)
      },
    )

    return () => {
      api.interceptors.response.eject(interceptor)
    }
  }, [user])
  async function login(credentials: LoginCredentials): Promise<boolean> {
    setBusy(true)
    setMessage('')

    try {
      await api.get('/sanctum/csrf-cookie')

      const response = await api.post<AuthResponse>(
        '/login',
        credentials,
      )

      const deadline = Date.parse(response.data.meta.expires_at)

      if (!Number.isFinite(deadline) || deadline <= Date.now()) {
        throw new Error('A sessão recebida não tem um prazo válido.')
      }

      setExpiresAt(deadline)
      setUser(response.data.data)
      setMessage('Login efetuado.')

      return true
    } catch (error) {
      setMessage(errorMessage(error))

      return false
    } finally {
      setBusy(false)
    }
  }

  async function logout(): Promise<void> {
    setBusy(true)
    setMessage('')

    try {
      await api.get('/sanctum/csrf-cookie')
      await api.post('/logout')

      setUser(null)
      setExpiresAt(null)
      setMessage('Sessão terminada.')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setUser(null)
        setExpiresAt(null)
        setMessage('A sessão já terminou.')
      } else {
        setMessage(errorMessage(error))
      }
    } finally {
      setBusy(false)
    }
  }

  return {
    user,
    message,
    ready,
    busy,
    login,
    logout,
    handleSessionExpired,
  }
}