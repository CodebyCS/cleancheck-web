import './components.css'
import { pageTitles } from './navigationConfig'
import type { Page } from './navigationConfig'

export type NavigationBadge = { count: number; urgent: boolean }

type NavigationProps = {
  current: Page
  onNavigate: (page: Page) => void
  badges?: Partial<Record<Page, NavigationBadge>>
}

const items: { page: Page; icon: string }[] = [
  { page: 'dashboard', icon: '◈' },
  { page: 'alerts', icon: '⚠' },
  { page: 'tasks', icon: '✓' },
  { page: 'serviceProviders', icon: '♙' },
  { page: 'properties', icon: '▦' },
  { page: 'icalImport', icon: '▤' },
  { page: 'icalSources', icon: '↻' },
  { page: 'notices', icon: '♧' },
  { page: 'rates', icon: '€' },
  { page: 'serviceEntries', icon: '☰' },
]

export function Navigation({
  current,
  onNavigate,
  badges,
}: NavigationProps) {
  return (
    <nav className="sidebar-nav" aria-label="Navegação principal">
      {items.map(({ page, icon }) => {
        const badge = badges?.[page]
        const showBadge = badge !== undefined && badge.count > 0

        return (
          <button
            key={page}
            type="button"
            className="sidebar-nav-item"
            aria-current={current === page ? 'page' : undefined}
            // The badge number alone means nothing to a screen reader.
            aria-label={showBadge ? `${pageTitles[page]}, ${badge.count} ativos` : undefined}
            onClick={() => onNavigate(page)}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              {icon}
            </span>

            <span>{pageTitles[page]}</span>

            {showBadge && (
              <span
                className={badge.urgent ? 'sidebar-nav-badge sidebar-nav-badge-urgent' : 'sidebar-nav-badge'}
                aria-hidden="true"
              >
                {badge.count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}