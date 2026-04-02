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
          color: '#78716c', fontSize: 14, textAlign: 'center',
        }}>
          Hi! I'm Carty<br />Ask me for outfit ideas, or upload a photo to find similar items.
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{
            background: '#edeae5', borderRadius: '18px 18px 18px 4px',
            padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center',
          }}>
            <span className="dot" />
            <span className="dot" style={{ animationDelay: '0.2s' }} />
            <span className="dot" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
