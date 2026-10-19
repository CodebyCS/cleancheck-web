import './components.css'

export type Page = 'properties' | 'serviceProviders'

type NavigationProps = {
  current: Page
  onNavigate: (page: Page) => void
}

const items: { page: Page; label: string }[] = [
  { page: 'properties', label: 'Imóveis' },
  { page: 'serviceProviders', label: 'Prestadores' },
]

export function Navigation({ current, onNavigate }: NavigationProps) {
  return (
    <nav className="navigation" aria-label="Navegação principal">
      {items.map(({ page, label }) => {
        const active = page === current

        return (
          <button
            key={page}
            type="button"
            className={active ? 'navigation-item active' : 'navigation-item'}
            aria-current={active ? 'page' : undefined}
            onClick={() => onNavigate(page)}
          >
            {label}
          </button>
        )
      })}
    </nav>
  )
}
