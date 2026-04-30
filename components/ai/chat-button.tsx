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
        className="fixed bottom-5 right-4 z-50 h-14 w-14 rounded-full bg-slate-950 text-white shadow-xl shadow-slate-900/25 hover:bg-slate-800 sm:right-6"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close AI sales chat' : 'Open AI sales chat'}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
      </Button>
    </>
  )
}
