import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { listAssignmentWarnings } from '../../services/assignmentWarnings'
import type { AssignmentWarning, TaskAssignmentWarning } from '../../services/assignmentWarnings'
import './AssignmentWarnings.css'

type Props = {
  // Any value that changes when the task list is refreshed, so the warnings follow it.
  refreshToken: unknown
  onOpenTask: (taskId: number) => void
  onSessionExpired: () => void
}

function warningLabel(warning: AssignmentWarning): string {
  switch (warning.code) {
    case 'no_default_provider':
      return 'Sem prestador: o imóvel não tem prestador padrão.'
    case 'default_provider_inactive':
      return 'Sem prestador: o prestador padrão do imóvel está inativo.'
    case 'unassigned':
      return 'Sem prestador atribuído.'
    case 'provider_inactive':
      return 'O prestador atribuído está inativo.'
    case 'schedule_conflict': {
      const ids = (warning.conflicting_task_ids ?? []).map((id) => `#${id}`).join(', ')
      return ids ? `Conflito de horário com a tarefa ${ids}.` : 'Conflito de horário com outra tarefa.'
    }
    default:
      return warning.code
  }
}

function typeLabel(value: string): string {
  if (value === 'checkout_cleaning') return 'Limpeza após checkout'
  if (value === 'checkin_inspection') return 'Inspeção antes do check-in'
  return value
}

function dateLabel(value: string | null): string {
  if (!value) return 'Sem data'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Data inválida'
    : new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

/**
 * Tasks that need a decision: without provider, with an inactive provider or with a schedule conflict.
 * Nothing is assigned here; the task is opened so staff can change the provider manually.
 */
export function AssignmentWarnings({ refreshToken, onOpenTask, onSessionExpired }: Props) {
  const [items, setItems] = useState<TaskAssignmentWarning[]>([])
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(true)
  // Kept in a ref so a new callback from the parent does not trigger another request.
  const sessionExpiredRef = useRef(onSessionExpired)

  useEffect(() => {
    sessionExpiredRef.current = onSessionExpired
  }, [onSessionExpired])

  useEffect(() => {
    let active = true

    listAssignmentWarnings()
      .then((data) => {
        if (!active) return
        setItems(data)
        setError('')
      })
      .catch((requestError: unknown) => {
        if (!active) return
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined

        if (status === 401) {
          sessionExpiredRef.current()
          return
        }

        // 404: the API does not have the endpoint yet; the page keeps working without warnings.
        // Logged so a wrong route does not go unnoticed. Remove once the endpoint is in develop.
        if (status === 404) {
          console.warn('GET /api/tasks/assignment-warnings returned 404; assignment warnings are hidden.')
        }

        setItems([])
        setError(status === 404 ? '' : 'Não foi possível carregar os avisos de atribuição.')
      })

    return () => {
      active = false
    }
  }, [refreshToken])

  if (error) {
    return <p className="assignment-warnings-error" role="status">{error}</p>
  }

  if (items.length === 0) return null

  return (
    <section className="assignment-warnings" aria-labelledby="assignment-warnings-title">
      <header className="assignment-warnings-header">
        <h2 id="assignment-warnings-title">
          Atribuições a rever <span className="assignment-warnings-count">{items.length}</span>
        </h2>
        <button
          type="button"
          className="assignment-warnings-toggle"
          aria-expanded={expanded}
          aria-controls="assignment-warnings-list"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Esconder' : 'Mostrar'}
        </button>
      </header>

      {expanded && (
        <>
          <p className="assignment-warnings-hint">
            Nenhum prestador é escolhido automaticamente. Abra a tarefa para atribuir ou trocar o prestador.
          </p>
          <ul id="assignment-warnings-list" className="assignment-warnings-list">
            {items.map((item) => (
              <li key={item.task_id} className="assignment-warnings-item">
                <div className="assignment-warnings-info">
                  <strong>
                    #{item.task_id} · {item.property_name ?? `Imóvel #${item.property_id}`}
                  </strong>
                  <span>
                    {typeLabel(item.type)} · {dateLabel(item.scheduled_start_at)}
                  </span>
                  <ul className="assignment-warnings-reasons">
                    {item.warnings.map((warning) => (
                      <li key={warning.code}>{warningLabel(warning)}</li>
                    ))}
                  </ul>
                </div>
                <button type="button" className="assignment-warnings-open" onClick={() => onOpenTask(item.task_id)}>
                  Abrir tarefa
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
