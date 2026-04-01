import type { DisplayMessage } from '../types'
import { ProductGrid } from './ProductGrid'

interface MessageBubbleProps {
  message: DisplayMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
    }}>
      <div style={{
        maxWidth: '75%',
        background: isUser ? '#2563eb' : '#f3f4f6',
        color: isUser ? '#fff' : '#111827',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '10px 14px',
        fontSize: 14,
        lineHeight: 1.5,
        wordBreak: 'break-word',
      }}>
        {message.imagePreviewUrl && (
          <img
            src={message.imagePreviewUrl}
            alt="Uploaded"
            style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: 8 }}
          />
        )}
        {message.text}
      </div>
      {message.products && message.products.length > 0 && (
        <div style={{ maxWidth: '90%', width: '100%' }}>
          <ProductGrid products={message.products} />
        </div>
      )}
    </div>
  )
}
