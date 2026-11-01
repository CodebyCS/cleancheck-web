import { useState } from 'react'
import { Navigation } from './components/Navigation'
import type { Page } from './components/Navigation'
import { PropertiesPage } from './pages/PropertiesPage'
import { ServiceProvidersPage } from './pages/ServiceProvidersPage'
import { IcalImportPage } from './pages/IcalImportPage'
import { useAuth } from './auth/hooks/useAuth'
import { LoginForm } from './auth/components/LoginForm'
import { ApiHealthStatus } from './diagnostics/components/ApiHealthStatus'

export default function App() {
  const [page, setPage] = useState<Page>('properties')
  const { user, message, ready, busy, login, logout } = useAuth()


  return (
  
    <main style={{ padding: 24 }}>
      <h1>CleanCheck</h1>

      <ApiHealthStatus />

      <hr />

      {!ready ? (
        <p>A verificar a sessão...</p>
      ) : user ? (
        <>
          <section>
            <h2>Olá, {user.name}</h2>
            <p>{user.email}</p>
            <p>Perfil: {user.role}</p>

            <button disabled={busy} onClick={() => void logout()}>
              {busy ? 'A terminar...' : 'Sair'}
            </button>
          </section>

          <hr />

          {user.role === 'service_provider' ? (
            <p>Esta área é reservada a administradores e supervisores.</p>
          ) : (
            <>
              <Navigation current={page} onNavigate={setPage} />
              {page === 'properties' && <PropertiesPage />}
              {page === 'serviceProviders' && <ServiceProvidersPage />}
              {page === 'icalImport' && <IcalImportPage />}
            </>
          )}
        </>
      ) : (
        <LoginForm busy={busy} onLogin={login} />
      )}

      {message && <p role="status">{message}</p>}
    </main>
  )
}