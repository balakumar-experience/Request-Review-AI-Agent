import { ArrowUp, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

interface ComposerInputProps {
  placeholder?: string
  onSubmit: (text: string) => void | Promise<void>
  label?: string
  submitLabel?: string
  rows?: number
  variant?: 'hero' | 'followup'
  disabled?: boolean
  initialValue?: string
  hint?: string
  /** Text range to focus and select once the composer is populated. */
  initialSelection?: { start: number; end: number } | null
}

export function ComposerInput({
  placeholder,
  onSubmit,
  label = 'What would you like to do?',
  submitLabel = 'Prepare Request',
  rows = 6,
  variant = 'hero',
  disabled = false,
  initialValue = '',
  hint = '⌘ Enter to prepare',
  initialSelection = null,
}: ComposerInputProps) {
  const [value, setValue] = useState(initialValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const field = textareaRef.current
    if (!field || !initialSelection || !initialValue) {
      return
    }

    field.focus()
    field.setSelectionRange(initialSelection.start, initialSelection.end)
    // Runs once per composer instance; the panel remounts it when the draft changes.
  }, [initialSelection, initialValue])

  function submit(text: string) {
    const next = text.trim()
    if (!next || disabled) {
      return
    }
    void onSubmit(next)
    setValue('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit(value)
    }
  }

  return (
    <form className={`composer composer--${variant}`} onSubmit={handleSubmit}>
      <div className="composer__heading">
        <Sparkles size={18} />
        <label htmlFor="agent-composer">{label}</label>
      </div>
      <textarea
        id="agent-composer"
        ref={textareaRef}
        className="composer__input"
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="composer__footer">
        <p className="composer__hint">{hint}</p>
        <button type="submit" className="btn btn--primary" disabled={disabled || !value.trim()}>
          {submitLabel}
          <ArrowUp size={16} />
        </button>
      </div>
    </form>
  )
}
