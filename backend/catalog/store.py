from typing import Protocol

from models.schemas import Product


class CatalogStore(Protocol):
    def search(self, query: str, top_k: int) -> list[Product]: ...
    def all_products(self) -> list[Product]: ...
