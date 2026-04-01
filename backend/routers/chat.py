from fastapi import APIRouter, HTTPException
from catalog.loader import get_catalog_store
from agent.loop import run_agent
from models.schemas import ChatRequest, ChatResponse
from config import settings

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    # Validate last message length
    if request.messages:
        last = request.messages[-1]
        if len(last.content) > settings.max_message_length:
            raise HTTPException(status_code=422, detail="Message too long")

    # Validate image size
    if request.image:
        import base64, binascii
        try:
            raw = base64.b64decode(request.image)
        except binascii.Error:
            raise HTTPException(status_code=422, detail="Invalid base64 image")
        if len(raw) > settings.max_image_bytes:
            raise HTTPException(status_code=422, detail="Image too large")

    store = get_catalog_store()
    return await run_agent(request, store)
