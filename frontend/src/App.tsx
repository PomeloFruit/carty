import { useChat } from './hooks/useChat'
import { ChatWindow } from './components/ChatWindow'
import { ChatInput } from './components/ChatInput'

export default function App() {
  const { messages, isLoading, pendingImageDataUrl, sendMessage, selectImage, removeImage } = useChat()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', maxWidth: 800,
      margin: '0 auto',
      background: '#f7f5f2',
    }}>
      <header style={{
        padding: '14px 20px', borderBottom: '1px solid #3d3532',
        background: '#292524', flexShrink: 0,
      }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#faf9f7' }}>
          Carty
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#a8a29e' }}>
          Your AI shopping assistant
        </p>
      </header>

      <ChatWindow messages={messages} isLoading={isLoading} />

      <ChatInput
        onSend={sendMessage}
        onImageSelect={selectImage}
        onImageRemove={removeImage}
        pendingImageDataUrl={pendingImageDataUrl}
        disabled={isLoading}
      />
    </div>
  )
}
