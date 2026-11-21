import { useEffect, useState } from 'react'
import { errorMessage } from '../api'
import type { Page } from '../components/navigationConfig'
import { listTasks } from '../services/tasks'
import type { TaskSummary } from '../services/tasks'
import { listProperties } from '../services/properties'
import { listServiceProviders } from '../services/serviceProviders'
import { listNotices, noticeLabels } from '../services/notices'
import type { BookingNotice } from '../services/notices'
import { ManualInspectionForm } from '../components/tasks/ManualInspectionForm'
import { Button } from '../components/Button'

type DashboardPageProps = {
  onNavigate: (page: Page) => void
}

type DashboardData = {
  tasks: TaskSummary[]
  activeProperties: number
  activeProviders: number
  notices: BookingNotice[]
  unreadCount: number
}

type MetricCardProps = {
  label: string
  value: number
  detail: string
  icon: string
  tone?: 'default' | 'success' | 'warning'
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = 'default',
}: MetricCardProps) {
  return (
    <div className={`dashboard-metric metric-${tone}`}>
      <div className="metric-heading">
        <h3>{label}</h3>
        <span aria-hidden="true">{icon}</span>
      </div>

      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </div>
  )
}

function isToday(value: string): boolean {
  const date = new Date(value)
  const today = new Date()

  return (
    date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
  )
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Data indisponível'

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function taskStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em curso',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  }

  return labels[status] ?? status
}

export function DashboardPage({
  onNavigate,
}: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [referenceTime, setReferenceTime] = useState(() => Date.now())

  useEffect(() => {
    let active = true

    Promise.all([
      listTasks(),
      listProperties('active'),
      listServiceProviders('active'),
      listNotices(1, true),
    ])
      .then(([tasks, properties, providers, notices]) => {
        if (!active) return
        setReferenceTime(Date.now())

        setData({
          tasks,
          activeProperties: properties.length,
          activeProviders: providers.length,
          notices: notices.notices,
          unreadCount: notices.unreadCount,
        })
        setError('')
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause))
      })

    return () => {
      active = false
    }
  }, [revision])

  if (error) {
    return (
      <div className="dashboard-error" role="alert">
        <p>{error}</p>
        <button
          className="dashboard-link"
          type="button"
          onClick={() => {
            setError('')
            setData(null)
            setRevision((value) => value + 1)
          }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data) {
    return <p role="status">A carregar a visão geral...</p>
  }

  const todayCleanings = data.tasks.filter(
    (task) =>
      task.type === 'checkout_cleaning'
      && isToday(task.scheduled_start_at),
  )

  const completed = todayCleanings.filter(
    (task) => task.status === 'completed',
  ).length

  const inProgress = todayCleanings.filter(
    (task) => task.status === 'in_progress',
  ).length

  const pendingToday = todayCleanings.filter(
    (task) =>
      task.status === 'pending'
      || task.status === 'in_progress',
  ).length

  const overdue = data.tasks.filter(
    (task) =>
      task.is_overdue
      && task.status !== 'completed'
      && task.status !== 'cancelled',
  ).length

  const upcoming = data.tasks
    .filter(
      (task) =>
        task.status === 'pending'
        && new Date(task.scheduled_start_at).getTime() >= referenceTime,
    )
    .sort(
      (first, second) =>
        new Date(first.scheduled_start_at).getTime()
        - new Date(second.scheduled_start_at).getTime(),
    )
    .slice(0, 4)

  const operationDate = new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">
            Operação · {operationDate}
          </p>
          <h1 className="dashboard-title">Visão geral da operação</h1>
          <p className="dashboard-description">
            Acompanhe as limpezas, reservas e equipas num só lugar.
          </p>
        </div>

        <div className="dashboard-actions">
          <ManualInspectionForm
            onCreated={() => setRevision((value) => value + 1)}
          />

          <Button
            variant="secondary"
            onClick={() => onNavigate('serviceProviders')}
          >
            Funcionários
          </Button>

          <Button
            variant="secondary"
            onClick={() => onNavigate('properties')}
          >
            Apartamentos
          </Button>
          
        </div>
      </div>

      <div className="dashboard-metrics">
        <MetricCard
          label="Limpezas hoje"
          value={todayCleanings.length}
          detail={`${pendingToday} por concluir`}
          icon="▤"
        />
        <MetricCard
          label="Concluídas"
          value={completed}
          detail="limpezas previstas para hoje"
          icon="✓"
          tone="success"
        />
        <MetricCard
          label="Em andamento"
          value={inProgress}
          detail="limpezas de hoje em curso"
          icon="◷"
        />
        <MetricCard
          label="Atrasadas"
          value={overdue}
          detail="tarefas que requerem atenção"
          icon="!"
          tone="warning"
        />
        <MetricCard
          label="Funcionários ativos"
          value={data.activeProviders}
          detail="prestadores ativos"
          icon="♙"
        />
        <MetricCard
          label="Apartamentos ativos"
          value={data.activeProperties}
          detail="imóveis disponíveis"
          icon="⌂"
        />
      </div>

      <div className="dashboard-panels">
        <section className="dashboard-panel">
          <header className="dashboard-panel-header">
            <div>
              <h2>Próximas tarefas</h2>
              <p>Agenda operacional mais próxima</p>
            </div>
            <button
              className="dashboard-link"
              type="button"
              onClick={() => onNavigate('tasks')}
            >
              Ver todas →
            </button>
          </header>

          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Imóvel</th>
                  <th>Data e hora</th>
                  <th>Responsável</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.property ?? 'Imóvel indisponível'}</strong>
                      <small>
                        {task.type === 'checkout_cleaning'
                          ? 'Limpeza de saída'
                          : 'Inspeção de entrada'}
                      </small>
                    </td>
                    <td>{formatDate(task.scheduled_start_at)}</td>
                    <td>{task.service_provider ?? 'Por atribuir'}</td>
                    <td>
                      <span className="dashboard-status">
                        {taskStatus(task.status)}
                      </span>
                    </td>
                  </tr>
                ))}

                {upcoming.length === 0 && (
                  <tr>
                    <td colSpan={4}>Não há próximas tarefas pendentes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel">
          <header className="dashboard-panel-header">
            <div>
              <h2>Avisos de reservas</h2>
              <p>{data.unreadCount} por consultar</p>
            </div>
            <button
              className="dashboard-link"
              type="button"
              onClick={() => onNavigate('notices')}
            >
              Ver avisos →
            </button>
          </header>

          <ul className="dashboard-notices">
            {data.notices.slice(0, 3).map((notice) => (
              <li key={notice.id}>
                <span className="dashboard-notice-dot" aria-hidden="true" />
                <div>
                  <p>
                    {noticeLabels[notice.type]} · {notice.property.name}
                  </p>
                  <small>
                    Entrada {notice.booking.checkIn.slice(0, 10)}
                    {' · '}
                    Saída {notice.booking.checkOut.slice(0, 10)}
                  </small>
                </div>
              </li>
            ))}
          </ul>

          {data.notices.length === 0 && (
            <p className="dashboard-empty">Não há avisos por consultar.</p>
          )}
        </section>
      </div>

      <p className="dashboard-footnote">
        Indicadores calculados a partir dos dados da API.
        As datas são apresentadas no fuso horário deste dispositivo.
      </p>
    </div>
  )
}