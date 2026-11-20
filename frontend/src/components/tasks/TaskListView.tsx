import type { TaskSummary } from '../../services/tasks'

type Props = {
  tasks: TaskSummary[]
  selectedId: number | null
  onOpenTask: (id: number) => void
  dateLabel: (value: string | null) => string
  statusLabel: (status: string) => string
  typeLabel: (type: string) => string
}

export function TaskListView({
  tasks,
  selectedId,
  onOpenTask,
  dateLabel,
  statusLabel,
  typeLabel,
}: Props) {
  return (
    <>
      <h3>Lista</h3>

      <ul className="tasks-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              className={task.is_overdue ? 'task-item task-overdue' : 'task-item'}
              aria-current={selectedId === task.id ? 'true' : undefined}
              onClick={() => onOpenTask(task.id)}
            >
              <strong>{task.property ?? 'Imóvel sem nome'}</strong>
              <span>
                {typeLabel(task.type)} · {dateLabel(task.scheduled_start_at)}
              </span>
              <span>Estado: {statusLabel(task.status)}</span>
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
          </li>
        ))}
      </ul>
    </>
  )
}