import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../Button'
import { Message } from '../Message'
import type { ServiceProvider } from '../../services/serviceProviders'
import {
  getTaskEvidenceFile,
  listTaskEvidence,
} from '../../services/tasks'
import type { TaskDetail, TaskEvidence } from '../../services/tasks'

type TaskAction = 'complete' | 'cancel' | 'restore'

type Props = {
  selectedId: number | null
  detail: TaskDetail | null
  detailLoading: boolean
  detailError: string
  onRetryDetail: () => void
  dateLabel: (value: string | null) => string
  typeLabel: (type: string) => string
  taskActionError: string
  taskAction: TaskAction | null
  onTaskAction: (action: TaskAction) => void
  saving: boolean
  providers: ServiceProvider[]
  providerId: string
  onProviderChange: (value: string) => void
  saveError: string
  onAssign: (event: FormEvent<HTMLFormElement>) => void
}

type EvidencePreview = TaskEvidence & {
  previewUrl: string
}

export function TaskDetailPanel({
  selectedId,
  detail,
  detailLoading,
  detailError,
  onRetryDetail,
  dateLabel,
  typeLabel,
  taskActionError,
  taskAction,
  onTaskAction,
  saving,
  providers,
  providerId,
  onProviderChange,
  saveError,
  onAssign,
}: Props) {

    const [evidenceState, setEvidenceState] = useState<{
      taskId: number
      items: EvidencePreview[]
      error: string
    } | null>(null)

    const taskId = detail?.id ?? null
    const evidence = evidenceState?.taskId === taskId ? evidenceState.items : []
    const evidenceError = evidenceState?.taskId === taskId ? evidenceState.error : ''
    const evidenceLoading =
      taskId !== null && evidenceState?.taskId !== taskId

    useEffect(() => {
      let cancelled = false
      const previewUrls: string[] = []

      if (taskId === null) {
        return () => {
          cancelled = true
        }
      }

      void listTaskEvidence(taskId)
        .then(async (items) => {
          const previews = await Promise.all(
            items.map(async (item) => {
              const blob = await getTaskEvidenceFile(item.file_url)
              const previewUrl = URL.createObjectURL(blob)
              previewUrls.push(previewUrl)

              return { ...item, previewUrl }
            }),
          )

          if (!cancelled) {
            setEvidenceState({ taskId, items: previews, error: '' })
          }
        })
        .catch(() => {
          if (!cancelled) {
            setEvidenceState({
              taskId,
              items: [],
              error: 'Não foi possível carregar os ficheiros desta tarefa.',
            })
          }
        })

      return () => {
        cancelled = true
        previewUrls.forEach((url) => URL.revokeObjectURL(url))
      }
    }, [taskId])

  return (
    <div className="task-detail">
      <h3>Detalhe</h3>

      {selectedId === null && (
        <p>Selecione uma tarefa para ver o detalhe e atribuir um prestador.</p>
      )}

      {detailLoading && <Message type="info">A carregar detalhe...</Message>}

      {detailError && (
        <Message type="error">
          {detailError}{' '}
          <button type="button" onClick={onRetryDetail}>
            Tentar novamente
          </button>
        </Message>
      )}

      {detail && !detailLoading && (
        <>
          <dl className="task-fields">
            <dt>Imóvel</dt>
            <dd>{detail.property ?? 'Imóvel sem nome'}</dd>

            <dt>Morada</dt>
            <dd>{detail.property_address ?? 'Não disponível'}</dd>

            <dt>Tipo</dt>
            <dd>{typeLabel(detail.type)}</dd>

            <dt>Estado</dt>
            <dd>{detail.status}</dd>

            <dt>Data</dt>
            <dd>{dateLabel(detail.scheduled_start_at)}</dd>

            <dt>Prazo</dt>
            <dd>{dateLabel(detail.scheduled_end_at)}</dd>

            <dt>Início real</dt>
            <dd>{dateLabel(detail.started_at)}</dd>

            <dt>Conclusão real</dt>
            <dd>{dateLabel(detail.completed_at)}</dd>

            <dt>Registo atualizado em</dt>
            <dd>{dateLabel(detail.updated_at)}</dd>
          </dl>

          <section className="task-evidence">
            <h4>Fotos e vídeos enviados</h4>

            {evidenceLoading && (
              <Message type="info">A carregar ficheiros...</Message>
            )}

            {evidenceError && (
              <Message type="error">{evidenceError}</Message>
            )}

            {!evidenceLoading && !evidenceError && evidence.length === 0 && (
              <p>Nenhum ficheiro enviado para esta tarefa.</p>
            )}

            {evidence.map((item) => (
              <figure key={item.id} className="task-evidence-item">
                {item.kind === 'photo' ? (
                  <img
                    src={item.previewUrl}
                    alt={item.original_name}
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={item.previewUrl}
                    controls
                    preload="metadata"
                    aria-label={item.original_name}
                  />
                )}
                <figcaption>{item.original_name}</figcaption>
              </figure>
            ))}
          </section>

          {taskActionError && <Message type="error">{taskActionError}</Message>}

          <div className="task-actions">
            {detail.status === 'in_progress' && !detail.deleted_at && (
              <Button
                type="button"
                loading={taskAction === 'complete'}
                disabled={taskAction !== null}
                onClick={() => onTaskAction('complete')}
              >
                Concluir tarefa
              </Button>
            )}

            {detail.status === 'pending' && !detail.deleted_at && (
              <Button
                type="button"
                variant="secondary"
                loading={taskAction === 'cancel'}
                disabled={taskAction !== null}
                onClick={() => onTaskAction('cancel')}
              >
                Cancelar tarefa
              </Button>
            )}

            {detail.deleted_at && (
              <Button
                type="button"
                variant="secondary"
                loading={taskAction === 'restore'}
                disabled={taskAction !== null}
                onClick={() => onTaskAction('restore')}
              >
                Restaurar tarefa
              </Button>
            )}
          </div>

          <p className="task-limitation">
            O responsável atual e o histórico ainda não estão disponíveis nas consultas da API.
          </p>

          <form onSubmit={onAssign}>
            <label htmlFor="task-provider">Atribuir ou reatribuir a prestador ativo</label>

            <select
              id="task-provider"
              value={providerId}
              required
              disabled={saving || providers.length === 0}
              onChange={(event) => onProviderChange(event.target.value)}
            >
              <option value="">Selecione um prestador</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} — {provider.email}
                </option>
              ))}
            </select>

            {providers.length === 0 && (
              <p>Não existem prestadores ativos disponíveis.</p>
            )}

            {saveError && <Message type="error">{saveError}</Message>}

            <Button
              type="submit"
              loading={saving}
              disabled={!providerId || providers.length === 0}
            >
              Confirmar atribuição
            </Button>
          </form>
        </>
      )}
    </div>
  )
}