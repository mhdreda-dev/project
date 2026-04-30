'use client'

import { FormEvent, KeyboardEvent, useRef, useState } from 'react'
import { AlertCircle, Bot, Loader2, Send, Sparkles, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const suggestions = [
  'Do you have Nike size 42?',
  'Prix Adidas noir ?',
  'Show available t-shirts size M',
  'واش كاين توصيل فالمغرب؟',
]

export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function sendMessage(nextMessage?: string) {
    const cleanMessage = (nextMessage ?? input).replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!cleanMessage || cleanMessage.length > 500 || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: cleanMessage,
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/sales-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanMessage }),
      })
      const payload = (await response.json()) as {
        success: boolean
        error?: string
        data?: { answer?: string }
      }

      if (!response.ok || !payload.success || !payload.data?.answer) {
        throw new Error(payload.error || 'Unable to answer right now')
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: payload.data?.answer ?? '',
        },
      ])
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to answer right now'
      setError(message)
    } finally {
      setIsLoading(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <section
      aria-label="AI sales assistant"
      className={cn(
        'fixed bottom-24 right-4 z-50 flex h-[min(680px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-all duration-200 sm:right-6',
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-5">Sales Agent</h2>
            <p className="text-xs text-slate-300">Live inventory answers</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/10 hover:text-white"
          onClick={onClose}
          aria-label="Close chat"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-slate-950">Ask about products, sizes, colors, stock, or delivery.</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Answers use your real StockMaster inventory.
              </p>
            </div>
            <div className="grid gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => void sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {message.role === 'assistant' ? (
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </span>
              ) : null}
              <div
                className={cn(
                  'max-w-[82%] rounded-lg px-3 py-2 text-sm leading-6',
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-800 shadow-sm',
                )}
              >
                {message.content}
              </div>
              {message.role === 'user' ? (
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                  <User className="h-4 w-4" aria-hidden="true" />
                </span>
              ) : null}
            </div>
          ))
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Checking inventory...
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 500))}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={500}
            placeholder="Ask about stock..."
            className="max-h-28 min-h-10 flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none ring-offset-2 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send message">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-2 text-right text-[11px] text-slate-400">{input.length}/500</div>
      </form>
    </section>
  )
}
