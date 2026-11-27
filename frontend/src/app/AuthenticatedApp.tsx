import { useRef, useState } from 'react'
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
import { AlertsPage } from '../pages/AlertsPage'
import { useTaskAlertCounts } from '../hooks/useTaskAlertCounts'
import { RatesPage } from '../pages/RatesPage'
import { ChecklistsPage } from '../pages/ChecklistsPage'
import { MonthlyReportPage } from '../pages/MonthlyReportPage'
import { ServiceEntriesPage } from '../pages/ServiceEntriesPage'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // Providers cannot read alerts (403), so they never poll.
  const alertCounts = useTaskAlertCounts(user.role !== 'service_provider')
  const navigationBadges = alertCounts.counts
    ? { alerts: { count: alertCounts.counts.active, urgent: alertCounts.counts.high > 0 } }
    : undefined

  const today = new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
  }).format(new Date())

  function closeMobileMenu() {
    setMenuOpen(false)
    menuButtonRef.current?.focus()
  }

  function navigateFromMobile(nextPage: Page) {
    setPage(nextPage)
    closeMobileMenu()
  }

  if (user.role === 'service_provider') {
    return (
      <main className="login-page">
        <div className="login-api-status">
          <ApiHealthStatus />
        </div>

        <div className="provider-card">
          <img className="login-logo" src="/cleancheck-logo.svg" alt="CleanCheck" />
          <h1 className="provider-title">Olá, {user.name}</h1>
          <p className="provider-description">
            Esta área é reservada a administradores e supervisores.
            Utiliza a aplicação mobile para consultar as tuas tarefas.
          </p>
          <Button
            variant="secondary"
            loading={busy}
            loadingText="A terminar..."
            onClick={() => void onLogout()}
          >
            Terminar sessão
          </Button>
          {message && <p className="provider-message" role="status">{message}</p>}
        </div>
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

        <Navigation current={page} onNavigate={setPage} badges={navigationBadges} />

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
          <div
            className="admin-mobile-navigation"
            onKeyDown={(event) => {
              if (event.key === 'Escape' && menuOpen) {
                event.preventDefault()
                closeMobileMenu()
              }
            }}
          >
            <button
              ref={menuButtonRef}
              className="admin-menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-menu"
              aria-label={menuOpen ? 'Fechar navegação' : 'Abrir navegação'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="admin-menu-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>

              <span>Menu</span>
            </button>

            <div id="admin-mobile-menu" hidden={!menuOpen}>
              <Navigation
                current={page}
                onNavigate={navigateFromMobile}
                badges={navigationBadges}
              />
            </div>
          </div>
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
          {page === 'alerts' && (
            <AlertsPage onSessionExpired={onSessionExpired} onAlertsChanged={alertCounts.refresh} />
          )}
          {page === 'properties' && <PropertiesPage />}
          {page === 'serviceProviders' && <ServiceProvidersPage />}
          {page === 'icalImport' && <IcalImportPage />}
          {page === 'icalSources' && <IcalSourcesPage />}
          {page === 'tasks' && (
            <TasksPage onSessionExpired={onSessionExpired} />
          )}
          {page === 'notices' && <NoticesPage />}
          {page === 'rates' && <RatesPage />}
          {page === 'checklists' && <ChecklistsPage />}
          {page === 'serviceEntries' && <ServiceEntriesPage />}
          {page === 'monthlyReport' && <MonthlyReportPage />}
        </main>
      </div>
    </div>
  )
}
