import { Check, Copy, WandSparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface PromptSelection {
  start: number
  end: number
}

interface PromptTemplateProps {
  onUse: (text: string, selection: PromptSelection | null) => void
}

const DEFAULT_NAME = 'Michael Johnson'
const DEFAULT_EMAIL = 'michael@gmail.com'

function buildPrompt(name: string, email: string): string {
  const who = name.trim() || 'the customer'
  const address = email.trim()
  return address
    ? `Send ${who} a review request at ${address}`
    : `Send ${who} a review request`
}

type CopyState = 'idle' | 'copied' | 'manual'

export function PromptTemplate({ onUse }: PromptTemplateProps) {
  const [name, setName] = useState(DEFAULT_NAME)
  const [email, setEmail] = useState(DEFAULT_EMAIL)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const fallbackRef = useRef<HTMLTextAreaElement>(null)
  const copyTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current)
      }
    }
  }, [])

  const prompt = buildPrompt(name, email)

  function flashCopyState(next: CopyState) {
    setCopyState(next)
    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current)
    }
    copyTimer.current = window.setTimeout(() => setCopyState('idle'), 2400)
  }

  async function copyPrompt() {
    const fallback = fallbackRef.current
    if (fallback) {
      fallback.value = prompt
    }

    try {
      await Promise.race([
        navigator.clipboard.writeText(prompt),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('clipboard-timeout')), 700)
        }),
      ])
      flashCopyState('copied')
      return
    } catch {
      // Clipboard permission can be unavailable; fall back to a text selection.
    }

    if (!fallback) {
      return
    }

    fallback.focus()
    fallback.select()

    try {
      if (document.execCommand('copy')) {
        flashCopyState('copied')
        return
      }
    } catch {
      // Selection stays in place so the shortcut still works.
    }

    flashCopyState('manual')
  }

  function usePrompt() {
    const address = email.trim()
    const start = address ? prompt.lastIndexOf(address) : -1
    onUse(prompt, start >= 0 ? { start, end: start + address.length } : null)
  }

  return (
    <section className="prompt-template">
      <header className="prompt-template__head">
        <p className="prompt-template__kicker">
          <WandSparkles size={13} />
          Try this prompt
        </p>
        <button type="button" className="prompt-template__copy" onClick={() => void copyPrompt()}>
          {copyState === 'copied' ? <Check size={14} /> : <Copy size={14} />}
          {copyState === 'copied' ? 'Copied' : copyState === 'manual' ? 'Press ⌘C' : 'Copy'}
        </button>
      </header>

      <p className="prompt-template__sentence">
        Send
        <input
          className="prompt-token"
          value={name}
          aria-label="Recipient name"
          style={{ width: `${Math.max(name.length, 6) + 1}ch` }}
          onChange={(event) => setName(event.target.value)}
        />
        a review request at
        <input
          className="prompt-token prompt-token--email"
          value={email}
          type="email"
          aria-label="Recipient email"
          style={{ width: `${Math.max(email.length, 8) + 1}ch` }}
          onChange={(event) => setEmail(event.target.value)}
        />
      </p>

      <footer className="prompt-template__foot">
        <p>Edit the name or email above, then insert it into the composer.</p>
        <button type="button" className="prompt-template__use" onClick={usePrompt}>
          Use this prompt
        </button>
      </footer>

      <textarea
        ref={fallbackRef}
        className="prompt-template__clipboard"
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        defaultValue={prompt}
      />
    </section>
  )
}
