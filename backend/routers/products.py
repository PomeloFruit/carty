from fastapi import APIRouter
from catalog.loader import get_catalog_store
from models.schemas import Product

router = APIRouter()


@router.get("/products", response_model=list[Product])
async def list_products() -> list[Product]:
    return get_catalog_store().all_products()
