import { useEffect } from 'react'
import type { ReactNode } from 'react'
import './components.css'

type ModalProps = {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  closeDisabled?: boolean
}

export function Modal({ title, subtitle, onClose, children, footer, closeDisabled = false }: ModalProps) {
  // Close with Escape, unless a request is in progress.
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !closeDisabled) onClose()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, closeDisabled])

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!closeDisabled) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Fechar"
            disabled={closeDisabled}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  )
}
