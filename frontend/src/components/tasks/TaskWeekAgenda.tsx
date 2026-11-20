import type { TaskSummary } from '../../services/tasks'

type WeekDay = {
  key: string
  label: string
}

type Props = {
  tasks: TaskSummary[]
  weekStart: Date
  selectedId: number | null
  onOpenTask: (id: number) => void
  timeLabel: (value: string) => string
  dateLabel: (value: string | null) => string
  statusLabel: (status: string) => string
  typeLabel: (type: string) => string
}

function localDateKey(value: string): string | null {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function TaskWeekAgenda({
  tasks,
  weekStart,
  selectedId,
  onOpenTask,
  timeLabel,
  dateLabel,
  statusLabel,
  typeLabel,
}: Props) {
  const weekDays: WeekDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + index)

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')

    return {
      key,
      label: new Intl.DateTimeFormat('pt-PT', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
      }).format(date),
    }
  })

  const tasksByDay = new Map<string, TaskSummary[]>()

  for (const task of tasks) {
    const key = localDateKey(task.scheduled_start_at)
    if (!key) continue

    const dayTasks = tasksByDay.get(key) ?? []
    dayTasks.push(task)
    tasksByDay.set(key, dayTasks)
  }

  return (
    <>
      <h3>Agenda semanal</h3>

      <div className="task-week-scroll">
        <div className="task-week-grid">
          {weekDays.map((day) => {
            const dayTasks = tasksByDay.get(day.key) ?? []

            return (
              <section className="task-week-day" key={day.key}>
                <h4>{day.label}</h4>

                {dayTasks.length === 0 ? (
                  <p className="task-week-empty">Sem tarefas</p>
                ) : (
                  <ul className="tasks-list">
                    {dayTasks.map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          className={
                            task.is_overdue
                              ? 'task-item task-week-item task-overdue'
                              : 'task-item task-week-item'
                          }
                          aria-current={selectedId === task.id ? 'true' : undefined}
                          onClick={() => onOpenTask(task.id)}
                        >
                          <strong>
                            {timeLabel(task.scheduled_start_at)} ·{' '}
                            {task.property ?? 'Imóvel sem nome'}
                          </strong>

                          <span>{typeLabel(task.type)}</span>
                          <span>Estado: {statusLabel(task.status)}</span>

                          {task.is_overdue && (
                            <span className="task-overdue-label">Em atraso</span>
                          )}

                          <span>Reserva #{task.booking_id}</span>
                          <span>Prestador: {task.service_provider ?? 'Não atribuído'}</span>

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
                )}
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}