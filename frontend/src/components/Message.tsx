import type { ReactNode } from 'react'
import './components.css'

type MessageProps = {
  type: 'error' | 'success' | 'info'
  children: ReactNode
}

export function Message({ type, children }: MessageProps) {
  return (
    <div className={`message message-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
