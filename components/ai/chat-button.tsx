'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatPanel } from '@/components/ai/chat-panel'

export function ChatButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ChatPanel open={open} onClose={() => setOpen(false)} />
      <Button
        type="button"
        size="icon"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-40 h-14 w-14 rounded-full border border-white/10 bg-slate-950/90 text-white shadow-[0_18px_45px_-18px_rgba(15,23,42,0.75),0_0_24px_-12px_rgba(56,189,248,0.7)] backdrop-blur-xl transition-all duration-300 ease-out hover:scale-105 hover:border-white/20 hover:bg-slate-900 hover:shadow-[0_22px_50px_-20px_rgba(15,23,42,0.85),0_0_32px_-14px_rgba(56,189,248,0.85)] focus-visible:ring-slate-400 sm:bottom-28 sm:right-6"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close AI sales chat' : 'Open AI sales chat'}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
      </Button>
    </>
  )
}
