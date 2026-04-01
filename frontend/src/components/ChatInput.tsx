import { useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react'
import { ImagePreview } from './ImagePreview'

interface ChatInputProps {
  onSend: (text: string) => void
  onImageSelect: (base64: string, dataUrl: string) => void
  onImageRemove: () => void
  pendingImageDataUrl: string | null
  disabled: boolean
}

export function ChatInput({
  onSend,
  onImageSelect,
  onImageRemove,
  pendingImageDataUrl,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed && !pendingImageDataUrl) return
    onSend(trimmed)
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      // strip data URI prefix to get raw base64
      const base64 = dataUrl.split(',')[1]
      onImageSelect(base64, dataUrl)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div style={{ borderTop: '1px solid #e5e7eb', padding: '12px 16px', background: '#fff' }}>
      {pendingImageDataUrl && (
        <div style={{ marginBottom: 8 }}>
          <ImagePreview dataUrl={pendingImageDataUrl} onRemove={onImageRemove} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          aria-label="Attach image"
          style={{
            flexShrink: 0, width: 36, height: 36,
            border: '1px solid #e5e7eb', borderRadius: 8,
            background: '#f9fafb', cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          📎
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask Carty anything… or attach an image"
          rows={1}
          style={{
            flex: 1, resize: 'none', borderRadius: 8,
            border: '1px solid #e5e7eb', padding: '8px 12px',
            fontSize: 14, lineHeight: 1.5, outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !pendingImageDataUrl)}
          style={{
            flexShrink: 0, width: 36, height: 36,
            background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 8,
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Send"
        >
          ➤
        </button>
      </div>
    </div>
  )
}
