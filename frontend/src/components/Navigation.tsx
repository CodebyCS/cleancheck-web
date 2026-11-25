import './components.css'
import { pageTitles } from './navigationConfig'
import type { Page } from './navigationConfig'

type NavigationProps = {
  current: Page
  onNavigate: (page: Page) => void
}

const items: { page: Page; icon: string }[] = [
  { page: 'dashboard', icon: '◈' },
  { page: 'tasks', icon: '✓' },
  { page: 'serviceProviders', icon: '♙' },
  { page: 'properties', icon: '▦' },
  { page: 'icalImport', icon: '▤' },
  { page: 'icalSources', icon: '↻' },
  { page: 'notices', icon: '♧' },
  { page: 'rates', icon: '€' },
]

export function Navigation({
  current,
  onNavigate,
}: NavigationProps) {
  return (
    <nav className="sidebar-nav" aria-label="Navegação principal">
      {items.map(({ page, icon }) => (
        <button
          key={page}
          type="button"
          className="sidebar-nav-item"
          aria-current={current === page ? 'page' : undefined}
          onClick={() => onNavigate(page)}
        >
          <span className="sidebar-nav-icon" aria-hidden="true">
            {icon}
          </span>

          <span>{pageTitles[page]}</span>
        </button>
      ))}
    </nav>
  )
}