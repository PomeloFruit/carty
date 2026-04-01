from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from catalog.loader import get_catalog_store
from routers.chat import router as chat_router
from routers.products import router as products_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Pre-load catalog and embeddings at startup
    get_catalog_store()
    yield


app = FastAPI(title="Carty API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(products_router, prefix="/api")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
