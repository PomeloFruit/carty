from __future__ import annotations

import json
import numpy as np
from sentence_transformers import SentenceTransformer

from models.schemas import Product
from catalog.store import CatalogStore
from config import settings


def _embed_text(model: SentenceTransformer, products: list[Product]) -> np.ndarray:
    texts = [
        f"{p.name} {p.category} {p.description} {' '.join(p.tags)}"
        for p in products
    ]
    return model.encode(texts, normalize_embeddings=True, show_progress_bar=False)


class InMemoryCatalogStore:
    def __init__(self, products: list[Product], embeddings: np.ndarray) -> None:
        self._products = products
        self._embeddings = embeddings  # shape (N, D), already L2-normalised

    def search(self, query: str, top_k: int) -> list[Product]:
        model = _get_model()
        q_vec = model.encode([query], normalize_embeddings=True)[0]  # shape (D,)
        scores = self._embeddings @ q_vec  # dot product == cosine similarity
        indices = np.argsort(scores)[::-1][:top_k]
        return [self._products[i] for i in indices]

    def all_products(self) -> list[Product]:
        return list(self._products)


_model: SentenceTransformer | None = None
_store: InMemoryCatalogStore | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embed_model)
    return _model


def get_catalog_store() -> CatalogStore:
    global _store
    if _store is None:
        with open(settings.catalog_path) as f:
            raw = json.load(f)
        products = [Product(**item) for item in raw]
        model = _get_model()
        embeddings = _embed_text(model, products)
        _store = InMemoryCatalogStore(products, embeddings)
    return _store
