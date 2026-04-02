import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
        background: isUser ? '#292524' : '#edeae5',
        color: isUser ? '#faf9f7' : '#1c1917',
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
        {isUser ? (
          message.text
        ) : (
          <div className="prose">
            <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
          </div>
        )}
      </div>
      {message.products && message.products.length > 0 && (
        <div style={{ maxWidth: '90%', width: '100%' }}>
          <ProductGrid products={message.products} />
        </div>
      )}
    </div>
  )
}
