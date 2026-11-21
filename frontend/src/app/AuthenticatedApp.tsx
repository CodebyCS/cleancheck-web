import { useState } from 'react'
import type { AppUser } from '../api'
import { Navigation } from '../components/Navigation'
import { pageTitles } from '../components/navigationConfig'
import type { Page } from '../components/navigationConfig'
import { ApiHealthStatus } from '../diagnostics/components/ApiHealthStatus'
import { DashboardPage } from '../pages/DashboardPage'
import { IcalImportPage } from '../pages/IcalImportPage'
import { IcalSourcesPage } from '../pages/IcalSourcesPage'
import { PropertiesPage } from '../pages/PropertiesPage'
import { ServiceProvidersPage } from '../pages/ServiceProvidersPage'
import { TasksPage } from '../pages/TasksPage'
import { NoticesPage } from '../pages/NoticesPage'
import { Button } from '../components/Button'

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
  const [page, setPage] = useState<Page>('dashboard')

  const today = new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
  }).format(new Date())

  if (user.role === 'service_provider') {
    return (
      <main className="provider-access">
        <h1>Olá, {user.name}</h1>
        <p>Esta área é reservada a administradores e supervisores.</p>
        <button disabled={busy} onClick={() => void onLogout()}>
          {busy ? 'A terminar...' : 'Terminar sessão'}
        </button>
        {message && <p role="status">{message}</p>}
      </main>
    )
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">
            C&C
          </span>
          <div>
            <strong>Clean &amp; Check</strong>
            <small>Admin · Operações</small>
          </div>
        </div>

        <Navigation current={page} onNavigate={setPage} />

        <div className="admin-user">
          <span className="admin-user-avatar" aria-hidden="true">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>
              {user.role === 'admin' ? 'Administrador' : 'Supervisor'}
            </small>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Clean &amp; Check Admin</span>
            <span aria-hidden="true">/</span>
            <strong>{pageTitles[page]}</strong>
          </div>

          <div className="admin-topbar-actions">
            <ApiHealthStatus />

            <time className="admin-date">{today}</time>

            <Button
              variant="secondary"
              loading={busy}
              loadingText="A terminar..."
              onClick={() => void onLogout()}
            >
              Terminar sessão
            </Button>
          </div>
        </header>

        <main className="admin-workspace">
          {message && (
            <p className="admin-message" role="status">
              {message}
            </p>
          )}

          {page === 'dashboard' && (
            <DashboardPage onNavigate={setPage} />
          )}
          {page === 'properties' && <PropertiesPage />}
          {page === 'serviceProviders' && <ServiceProvidersPage />}
          {page === 'icalImport' && <IcalImportPage />}
          {page === 'icalSources' && <IcalSourcesPage />}
          {page === 'tasks' && (
            <TasksPage onSessionExpired={onSessionExpired} />
          )}
          {page === 'notices' && <NoticesPage />}
        </main>
      </div>
    </div>
  )
}