import base64
import binascii

from fastapi import APIRouter, HTTPException
from catalog.loader import get_catalog_store
from agent.loop import run_agent
from models.schemas import ChatRequest, ChatResponse
from config import settings

router = APIRouter()

# The frontend sends the full conversation history with every request (stateless backend).
# Cap it to prevent unbounded token costs and context-window overflows.
_MAX_HISTORY = 50


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    if len(body.messages) > _MAX_HISTORY:
        raise HTTPException(status_code=422, detail="Too many messages in history")

    # Validate last message length
    if body.messages:
        last = body.messages[-1]
        if len(last.content) > settings.max_message_length:
            raise HTTPException(status_code=422, detail="Message too long")

    # Validate image size
    if body.image:
        try:
            raw = base64.b64decode(body.image)
        except binascii.Error:
            raise HTTPException(status_code=422, detail="Invalid base64 image")
        if len(raw) > settings.max_image_bytes:
            raise HTTPException(status_code=422, detail="Image too large")

    store = get_catalog_store()
    return await run_agent(body, store)
