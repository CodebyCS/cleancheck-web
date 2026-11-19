import { useEffect, useState } from 'react'
import { errorMessage } from '../api'
import { Button } from '../components/Button'
import { Message } from '../components/Message'
import { listNotices, markNoticeAsRead, noticeLabels } from '../services/notices'
import type { BookingNotice } from '../services/notices'
import { formatDate, statusLabels } from '../utils/reservationFormat'
import './NoticesPage.css'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
}

export function NoticesPage() {
  const [notices, setNotices] = useState<BookingNotice[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let active = true

    listNotices(page, onlyUnread)
      .then((result) => {
        if (!active) return
        setNotices(result.notices)
        setLastPage(result.lastPage)
        setUnreadCount(result.unreadCount)
        setError('')
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [page, onlyUnread, reloadKey])

  // Loading is switched on here (not inside the effect) to follow the react-hooks lint rules.
  function changePage(next: number) {
    setLoading(true)
    setPage(next)
  }

  function changeFilter(checked: boolean) {
    setLoading(true)
    setOnlyUnread(checked)
    setPage(1)
  }

  function refresh() {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  async function handleMarkAsRead(id: number) {
    setMarkingId(id)
    setActionError('')

    try {
      const updated = await markNoticeAsRead(id)
      setNotices((current) =>
        onlyUnread
          ? current.filter((notice) => notice.id !== id)
          : current.map((notice) => (notice.id === id ? updated : notice)),
      )
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch (err: unknown) {
      setActionError(errorMessage(err))
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <section>
      <h2>Avisos</h2>
      <p>{unreadCount === 1 ? '1 aviso por ler' : `${unreadCount} avisos por ler`}</p>

      <div className="notices-toolbar">
        <label>
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(event) => changeFilter(event.target.checked)}
          />{' '}
          Só não lidos
        </label>
        <Button variant="secondary" loading={loading} loadingText="A carregar..." onClick={refresh}>
          Atualizar
        </Button>
      </div>

      {error && <Message type="error">{error}</Message>}
      {actionError && <Message type="error">{actionError}</Message>}

      {!loading && !error && notices.length === 0 && (
        <Message type="info">{onlyUnread ? 'Não há avisos por ler.' : 'Ainda não há avisos.'}</Message>
      )}

      <ul className="notice-list">
        {notices.map((notice) => (
          <li key={notice.id} className={notice.read ? 'notice' : 'notice notice-unread'}>
            <div className="notice-header">
              <strong>{noticeLabels[notice.type]}</strong>
              {!notice.read && <span className="notice-badge">Novo</span>}
              <span className="notice-time">{formatDateTime(notice.notifiedAt)}</span>
            </div>

            <p>
              {notice.property.name} · {formatDate(notice.booking.checkIn)} → {formatDate(notice.booking.checkOut)} ·{' '}
              {statusLabels[notice.booking.status]}
            </p>

            {!notice.read && (
              <Button
                variant="secondary"
                loading={markingId === notice.id}
                loadingText="A marcar..."
                disabled={markingId !== null}
                onClick={() => void handleMarkAsRead(notice.id)}
              >
                Marcar como lido
              </Button>
            )}
          </li>
        ))}
      </ul>

      {lastPage > 1 && (
        <div className="notices-pagination">
          <Button variant="secondary" disabled={loading || page <= 1} onClick={() => changePage(page - 1)}>
            Anterior
          </Button>
          <span>
            Página {page} de {lastPage}
          </span>
          <Button variant="secondary" disabled={loading || page >= lastPage} onClick={() => changePage(page + 1)}>
            Seguinte
          </Button>
        </div>
      )}
    </section>
  )
}