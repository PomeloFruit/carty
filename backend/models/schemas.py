from typing import Literal
from pydantic import BaseModel


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class Product(BaseModel):
    id: str
    name: str
    category: str
    description: str
    price: float
    tags: list[str]
    image_url: str


class ChatRequest(BaseModel):
    messages: list[Message]
    image: str | None = None  # base64-encoded, no data URI prefix


class ChatResponse(BaseModel):
    message: str
    products: list[Product] = []
