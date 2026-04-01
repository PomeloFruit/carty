import { useEffect, useRef } from 'react'
import type { DisplayMessage } from '../types'
import { MessageBubble } from './MessageBubble'

interface ChatWindowProps {
  messages: DisplayMessage[]
  isLoading: boolean
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column',
    }}>
      {messages.length === 0 && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#9ca3af', fontSize: 14, textAlign: 'center',
        }}>
          Hi! I'm Carty 🛍️<br />Ask me for outfit ideas, or upload a photo to find similar items.
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', marginBottom: 12,
        }}>
          <div style={{
            background: '#f3f4f6', borderRadius: '18px 18px 18px 4px',
            padding: '10px 14px', fontSize: 14, color: '#6b7280',
          }}>
            Carty is thinking…
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
