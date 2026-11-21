import { useAuth } from './auth/hooks/useAuth'
import { LoginPage } from './auth/pages/LoginPage'
import { AuthenticatedApp } from './app/AuthenticatedApp'

export default function App() {
  const auth = useAuth()

  if (!auth.ready) {
    return (
      <main className="login-page">
        <p className="login-loading">A verificar a sessão...</p>
      </main>
    )
  }

  if (!auth.user) {
    return (
      <LoginPage
        busy={auth.busy}
        message={auth.message}
        onLogin={auth.login}
      />
    )
  }

  return (
    <AuthenticatedApp
      user={auth.user}
      busy={auth.busy}
      message={auth.message}
      onLogout={auth.logout}
      onSessionExpired={auth.handleSessionExpired}
    />
  )
}