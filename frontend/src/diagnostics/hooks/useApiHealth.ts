import { useCallback, useEffect, useRef, useState } from 'react'
import { api, errorMessage } from '../../api'

type ApiHealthResponse = {
  application: string
  status: string
}

export function useApiHealth() {
  const [message, setMessage] = useState('A verificar a API...')
  const [loading, setLoading] = useState(true)
  const activeRequest = useRef<AbortController | null>(null)

  const fetchHealth = useCallback(() => {
    activeRequest.current?.abort()

    const controller = new AbortController()
    activeRequest.current = controller

    return api.get<ApiHealthResponse>('/api/health', {
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return

        if (
          response.data.application !== 'CleanCheck'
          || response.data.status !== 'ok'
        ) {
          setMessage('A API devolveu um diagnóstico inesperado.')
          return
        }

        setMessage(`${response.data.application}: ${response.data.status}`)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMessage(errorMessage(error))
        }
      })
      .finally(() => {
        if (activeRequest.current === controller) {
          activeRequest.current = null

          if (!controller.signal.aborted) {
            setLoading(false)
          }
        }
      })
  }, [])

  useEffect(() => {
    void fetchHealth()

    return () => {
      activeRequest.current?.abort()
    }
  }, [fetchHealth])

  function checkHealth() {
    setLoading(true)
    setMessage('A verificar a API...')
    void fetchHealth()
  }

  return {
    message,
    loading,
    checkHealth,
  }
}