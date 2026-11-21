import type { ButtonHTMLAttributes } from 'react'
import './components.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary'
}

export function Button({
  loading = false,
  loadingText = 'A guardar...',
  variant = 'primary',
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? loadingText : children}
    </button>
  )
}
