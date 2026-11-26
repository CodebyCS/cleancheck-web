import type { TaskSummary } from '../../services/tasks'

type Props = {
  tasks: TaskSummary[]
  selectedId: number | null
  onOpenTask: (id: number) => void
  dateLabel: (value: string | null) => string
  statusLabel: (status: string) => string
  typeLabel: (type: string) => string
  selectedTaskIds: Set<number>
  onToggleTaskSelection: (id: number) => void
}

export function TaskListView({
  tasks,
  selectedId,
  onOpenTask,
  dateLabel,
  statusLabel,
  selectedTaskIds,
  onToggleTaskSelection,
  typeLabel,
}: Props) {
  return (
    <>
      <h3>Lista</h3>

      <ul className="tasks-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <div className='task-selectable-card'>
              {(task.status === 'pending' || task.status === 'in_progress' || task.status === 'completed' && task.missing_evidence) && (
                <label className='task-select-control'>
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.has(task.id)}
                    onChange={() => onToggleTaskSelection(task.id)}
                    aria-label={`Selecionar tarefa #${task.id}`}
                  />
                </label>
              )}
              <button
                type="button"
                className={[
                  'task-item',
                  task.is_overdue ? 'task-overdue' : '',
                  task.missing_evidence ? 'task-missing-video' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={selectedId === task.id ? 'true' : undefined}
                onClick={() => onOpenTask(task.id)}
              >
                <strong>{task.property ?? 'Imóvel sem nome'}</strong>
                <span>Tarefa #{task.id}</span>
                <span>
                  {typeLabel(task.type)} · {dateLabel(task.scheduled_start_at)}
                </span>
                <span>Estado: {statusLabel(task.status)}</span>
                {task.missing_evidence && (<span className='task-missing-video-label'>Falta evidência</span>)}
                <span>Reserva #{task.booking_id}</span>
                <span>Prestador: {task.service_provider ?? 'Não atribuído'}</span>
                {task.is_overdue && <span className="task-overdue">Em atraso</span>}
                {task.completed_at && (
                  <span>
                    Concluída em {dateLabel(task.completed_at)}
                    {task.completed_by ? ` por ${task.completed_by}` : ''}
                  </span>
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}