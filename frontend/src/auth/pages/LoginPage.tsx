import { ApiHealthStatus } from '../../diagnostics/components/ApiHealthStatus'
import { LoginForm } from '../components/LoginForm'
import type { LoginCredentials } from '../hooks/useAuth'

type LoginPageProps = {
  busy: boolean
  message: string
  onLogin: (credentials: LoginCredentials) => Promise<boolean>
}

export function LoginPage({
  busy,
  message,
  onLogin,
}: LoginPageProps) {
  return (
    <main className="login-page">
      <div className="login-api-status">
        <ApiHealthStatus />
      </div>

      <div className="login-content">
        <LoginForm busy={busy} onLogin={onLogin} />

        {message && (
          <p className="login-message" role="status">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}