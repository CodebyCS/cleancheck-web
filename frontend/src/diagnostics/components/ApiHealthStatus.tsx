import { useApiHealth } from '../hooks/useApiHealth'

export function ApiHealthStatus() {
  const { message, loading, checkHealth } = useApiHealth()

  return (
    <section aria-labelledby="api-health-title" aria-busy={loading}>
      <h2 id="api-health-title">Ligação à API</h2>

      <p role="status">{message}</p>

      <button
        type="button"
        disabled={loading}
        onClick={() => void checkHealth()}
      >
        {loading ? 'A verificar...' : 'Verificar ligação'}
      </button>
    </section>
  )
}