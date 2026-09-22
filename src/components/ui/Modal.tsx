import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, description, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="ui-modal" role="presentation" onMouseDown={onClose}>
      <section
        className="ui-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ui-modal__header">
          <div>
            <h2 id="ui-modal-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="ui-icon-button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="ui-modal__body">{children}</div>
      </section>
    </div>
  )
}
