export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Product {
  id: string
  name: string
  category: string
  description: string
  price: number
  tags: string[]
  image_url: string
}

export interface ChatRequest {
  messages: Message[]
  image?: string
}

export interface ChatResponse {
  message: string
  products: Product[]
}

export interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  imagePreviewUrl?: string
  products?: Product[]
}
