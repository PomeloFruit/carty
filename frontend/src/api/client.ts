import type { ChatRequest, ChatResponse, Product } from '../types'

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`)
  return res.json() as Promise<ChatResponse>
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE}/products`)
  if (!res.ok) throw new Error(`Products request failed: ${res.status}`)
  return res.json() as Promise<Product[]>
}
