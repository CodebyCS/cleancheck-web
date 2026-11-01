import { useEffect, useState } from 'react'
import axios from 'axios'
import { api, errorMessage } from '../../api'
import type { AppUser } from '../../api'

export type LoginCredentials = {
  email: string
  password: string
  remember: boolean
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true

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

  async function login(credentials: LoginCredentials): Promise<boolean> {
    setBusy(true)
    setMessage('')

    try {
      await api.get('/sanctum/csrf-cookie')

      const response = await api.post<{ data: AppUser }>(
        '/login',
        credentials,
      )

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

  return {
    user,
    message,
    ready,
    busy,
    login,
    logout,
  }
}