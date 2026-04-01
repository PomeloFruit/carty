import { useState } from 'react'
import { chat } from '../api/client'
import type { DisplayMessage, Message } from '../types'

export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null)
  const [pendingImageDataUrl, setPendingImageDataUrl] = useState<string | null>(null)

  function selectImage(base64: string, dataUrl: string) {
    setPendingImageBase64(base64)
    setPendingImageDataUrl(dataUrl)
  }

  function removeImage() {
    setPendingImageBase64(null)
    setPendingImageDataUrl(null)
  }

  async function sendMessage(text: string) {
    if (!text.trim() && !pendingImageBase64) return

    // Snapshot and clear pending image
    const imageBase64 = pendingImageBase64
    const imageDataUrl = pendingImageDataUrl
    setPendingImageBase64(null)
    setPendingImageDataUrl(null)

    // Add optimistic user message
    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text.trim(),
      imagePreviewUrl: imageDataUrl ?? undefined,
    }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setIsLoading(true)

    // Build API message history (text only — images not resent in history)
    const apiMessages: Message[] = nextMessages.map((m) => ({
      role: m.role,
      content: m.text,
    }))

    try {
      const response = await chat({
        messages: apiMessages,
        image: imageBase64 ?? undefined,
      })

      const assistantMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: response.message,
        products: response.products,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Sorry, something went wrong. Please try again.',
      }
      setMessages((prev) => [...prev, errorMsg])
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    isLoading,
    pendingImageDataUrl,
    sendMessage,
    selectImage,
    removeImage,
  }
}
