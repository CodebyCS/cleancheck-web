import { useApiHealth } from '../hooks/useApiHealth'

export function ApiHealthStatus() {
  const { message, loading, checkHealth } = useApiHealth()

  const connected = !loading && message === 'CleanCheck: ok'

  const statusClass = loading
    ? 'api-status-loading'
    : connected
      ? 'api-status-connected'
      : 'api-status-offline'

  const label = loading
    ? 'A verificar API'
    : connected
      ? 'API ligada'
      : 'API indisponível'

  return (
    <div
      className={`api-status ${statusClass}`}
      aria-busy={loading}
      title={message}
    >
      <span className="api-status-dot" aria-hidden="true" />

      <span role="status">{label}</span>

      <button
        className="api-status-button"
        type="button"
        disabled={loading}
        onClick={() => void checkHealth()}
        aria-label="Verificar ligação à API"
      >
        Verificar
      </button>
    </div>
  )
}