# Carty — AI-Powered Commerce Agent

Carty is a conversational shopping assistant that helps users discover products through natural language chat and image-based search. It combines a semantic search engine with a two-turn LLM agent to understand intent, find relevant products, and surface them as interactive product cards — all with free inference via OpenRouter.

---

## Features

- **General conversation** — Ask questions, get help, or just browse; Carty handles open-ended chat gracefully
- **Text-based recommendations** — Describe what you're looking for and Carty searches the catalog semantically
- **Image-based search** — Upload a photo and Carty identifies what you're looking for and finds similar products
- **Free inference** — Powered by OpenRouter; the default model (`meta-llama/llama-4-scout:free`) requires no paid API plan
- **80-product catalog** — 8 categories, pre-loaded at startup with sentence-transformer embeddings for fast similarity search

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python, FastAPI, Uvicorn |
| LLM integration | OpenRouter (configurable model) |
| Semantic search | sentence-transformers (`all-MiniLM-L6-v2`), NumPy cosine similarity |
| Frontend | React, Vite, TypeScript |
| Containerisation | Docker, Docker Compose |
| Frontend serving | nginx (serves built assets, proxies `/api`) |

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A free [OpenRouter](https://openrouter.ai) API key

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/pomelofruit/carty.git
   cd carty
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and set your OpenRouter API key:

   ```
   OPENROUTER_API_KEY=your_key_here
   ```

   Get a free key at [openrouter.ai](https://openrouter.ai). No paid plan required — the default model is free.

3. **Start the stack**

   ```bash
   docker compose up --build
   ```

   The backend will start first (health-checked), then the frontend once the backend is healthy.

4. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000)

---

## API Reference

### `POST /api/chat`

Send a chat message (with optional image) and receive a reply plus matched products.

**Request**

```json
{
  "messages": [
    {"role": "user", "content": "I need a waterproof jacket for hiking"}
  ],
  "image": null
}
```

- `messages` — full conversation history (role: `"user"` or `"assistant"`)
- `image` — base64-encoded image string, or `null`

**Response**

```json
{
  "message": "Here are some waterproof jackets that would work great for hiking:",
  "products": [
    {
      "id": "prod_042",
      "name": "TrailShield Waterproof Jacket",
      "category": "Outdoor",
      "price": 129.99,
      "description": "...",
      "image_url": "..."
    }
  ]
}
```

---

### `GET /api/products`

Returns all 80 products in the catalog.

**Response** — array of product objects (same schema as above).

---

### `GET /api/health`

Liveness check used by Docker Compose.

**Response**

```json
{"status": "ok"}
```

---

## Architecture

### Two-Turn Agent Loop

Each chat request runs a two-turn LLM loop (`backend/agent/loop.py`):

1. **Turn 1** — The LLM receives the conversation history and a `search_catalog(query)` tool definition. If it determines a product search is needed, it calls the tool; otherwise it replies directly.
2. **Turn 2** — If a tool call was made, catalog results are injected into the context and the LLM synthesises a final natural-language reply. Products from the search are returned alongside the message.

### Semantic Search

`backend/catalog/loader.py` implements an `InMemoryCatalogStore`:

- At startup, all 80 products from `products.json` are embedded using `sentence-transformers/all-MiniLM-L6-v2`
- At query time, the query string is embedded and cosine similarity is computed against all product embeddings with NumPy
- The top-N most similar products are returned

Because embeddings are generated once at startup (behind a lifespan event), query latency is low.

### Stateless Backend

The frontend (`useChat` hook) holds the full conversation history and sends it with every request. The backend is stateless — no sessions or databases required.

---

## Development

### Backend (without Docker)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend (without Docker)

```bash
cd frontend
npm install
npm run dev
```

The dev server will be available at `http://localhost:3000` and proxies `/api` requests to `http://localhost:8000`.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | — | API key from [openrouter.ai](https://openrouter.ai) |
| `OPENROUTER_MODEL` | No | `meta-llama/llama-4-scout:free` | OpenRouter model identifier |
