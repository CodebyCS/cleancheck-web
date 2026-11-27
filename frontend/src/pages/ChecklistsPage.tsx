import { useEffect, useState } from 'react'
import axios from 'axios'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { checklistTaskTypes, listCurrentChecklists } from '../services/checklists'
import type { Checklist } from '../services/checklists'
import { rateTaskTypeLabel } from '../services/rates'
import { ChecklistForm } from './ChecklistForm'
import './records.css'
import './ChecklistsPage.css'

type ChecklistsPageProps = {
  // Only the admin changes checklists; the supervisor sees the one in force.
  canEdit: boolean
}

export function ChecklistsPage({ canEdit }: ChecklistsPageProps) {
  const [checklists, setChecklists] = useState<Partial<Record<string, Checklist>>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    listCurrentChecklists()
      .then((current) => {
        if (!active) return
        setChecklists(current)
        setLoadError('')
      })
      .catch((error: unknown) => {
        if (!active) return
        // 404: the API does not have checklists yet.
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setUnavailable(true)
          return
        }
        setLoadError(errorMessage(error))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleSaved(saved: Checklist) {
    setChecklists((current) => ({ ...current, [saved.task_type]: saved }))
    setEditing(null)
    setSuccess(`Checklist "${saved.name}" guardada. Aplica-se às tarefas criadas a partir de agora.`)
  }

  return (
    <section>
      <div className="records-toolbar">
        <div>
          <h2 className="page-title">Checklists</h2>
          <p className="record-card-meta">Checklist em vigor por tipo de tarefa</p>
        </div>
      </div>

      <p className="form-hint">
        O prestador marca estes itens um a um durante a tarefa. Cada tarefa fica com a checklist em vigor quando foi
        criada, por isso as alterações não mudam as tarefas já existentes.
        {!canEdit && ' Só o administrador pode alterar as checklists.'}
      </p>

      {success && <Message type="success">{success}</Message>}

      {loading ? (
        <Message type="info">A carregar checklists...</Message>
      ) : unavailable ? (
        <Message type="info">As checklists ainda não estão disponíveis nesta versão da API.</Message>
      ) : loadError ? (
        <Message type="error">{loadError}</Message>
      ) : (
        <div className="checklist-cards">
          {checklistTaskTypes.map((taskType) => {
            const checklist = checklists[taskType]
            const requiredCount = checklist?.items.filter((item) => item.required).length ?? 0

            return (
              <article key={taskType} className="checklist-card">
                <header className="checklist-card-head">
                  <div>
                    <p className="checklist-card-type">{rateTaskTypeLabel(taskType)}</p>
                    <h3>{checklist?.name ?? 'Sem checklist'}</h3>
                    {checklist && (
                      <p className="record-card-meta">
                        {checklist.items.length} itens · {requiredCount} obrigatórios
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant={checklist ? 'secondary' : 'primary'}
                      onClick={() => {
                        setSuccess('')
                        setEditing(taskType)
                      }}
                    >
                      {checklist ? 'Alterar' : 'Criar'}
                    </Button>
                  )}
                </header>

                {checklist ? (
                  <ol className="checklist-card-items">
                    {checklist.items.map((item) => (
                      <li key={item.id}>
                        <span>{item.label}</span>
                        <span className={item.required ? 'checklist-tag' : 'checklist-tag checklist-tag-optional'}>
                          {item.required ? 'Obrigatório' : 'Opcional'}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="form-hint">Ainda não há checklist para este tipo de tarefa.</p>
                )}
              </article>
            )
          })}
        </div>
      )}

      {editing !== null && (
        <ChecklistForm
          taskType={editing}
          current={checklists[editing] ?? null}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}
