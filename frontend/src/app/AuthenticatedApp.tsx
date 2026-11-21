import { useState } from 'react'
import type { AppUser } from '../api'
import { Navigation } from '../components/Navigation'
import type { Page } from '../components/Navigation'
import { ApiHealthStatus } from '../diagnostics/components/ApiHealthStatus'
import { PropertiesPage } from '../pages/PropertiesPage'
import { ServiceProvidersPage } from '../pages/ServiceProvidersPage'
import { IcalImportPage } from '../pages/IcalImportPage'
import { IcalSourcesPage } from '../pages/IcalSourcesPage'
import { TasksPage } from '../pages/TasksPage'
import { NoticesPage } from '../pages/NoticesPage'

type AuthenticatedAppProps = {
  user: AppUser
  busy: boolean
  message: string
  onLogout: () => Promise<void>
  onSessionExpired: () => void
}

export function AuthenticatedApp({
  user,
  busy,
  message,
  onLogout,
  onSessionExpired,
}: AuthenticatedAppProps) {
  const [page, setPage] = useState<Page>('properties')

  return (
    <main style={{ padding: 24 }}>
      <h1>CleanCheck</h1>

      <ApiHealthStatus />

      <hr />

      <section>
        <h2>Olá, {user.name}</h2>
        <p>{user.email}</p>
        <p>Perfil: {user.role}</p>

        <button disabled={busy} onClick={() => void onLogout()}>
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
          {page === 'icalSources' && <IcalSourcesPage />}
          {page === 'tasks' && (
            <TasksPage onSessionExpired={onSessionExpired} />
          )}
          {page === 'notices' && <NoticesPage />}
        </>
      )}

      {message && <p role="status">{message}</p>}
    </main>
  )
}