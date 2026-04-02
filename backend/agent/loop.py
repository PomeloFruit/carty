from __future__ import annotations

import base64
import binascii
import json
import re
from typing import Any

import httpx
from fastapi import HTTPException

from catalog.store import CatalogStore
from config import settings
from models.schemas import ChatRequest, ChatResponse, Product


_TOOL_SCHEMA: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "search_catalog",
            "description": (
                "Search the product catalog for items matching the query. "
                "Call this whenever the user asks for product recommendations, "
                "outfit ideas, or when an image suggests a product category."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural-language search query describing the desired products.",
                    }
                },
                "required": ["query"],
            },
        },
    }
]

_SYSTEM_PROMPT = (
    "You are Carty, a friendly and knowledgeable AI shopping assistant. "
    "Help users discover clothing and accessories from our catalog. "
    "When a user asks for recommendations or uploads an image, call search_catalog "
    "to find relevant products, then present them warmly and concisely. "
    "Keep responses conversational and under 120 words."
)


def _detect_mime_type(data: bytes) -> str:
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"  # fallback


def _extract_text_tool_call_query(text: str) -> str | None:
    """Extract a search_catalog query from models that output tool calls as text.

    The OpenAI tool-calling protocol requires models to signal a tool call via
    a structured `tool_calls` field on the response message and set
    `finish_reason` to "tool_calls". Capable models (e.g. Llama 4, GPT-4o)
    follow this correctly.

    However, some smaller free models — have problems using tool_calls. Instead
    sometimes they embed a JSON-like invocation directly in the response text, e.g.:
        TOOLCALL>[{"name": "search_catalog", "arguments": {"query": "..."}}]CALL>

    Because `finish_reason` is "stop" in these cases, the structured branch is
    never entered and the raw garbled text leaks to the user. This function
    detects that situation by scanning for any JSON object containing a query
    key, which is the only argument search_catalog accepts.
    """
    # Only treat this as a text-based tool call if "search_catalog" is named
    # somewhere in the text, then extract the "query" value directly.
    # We avoid trying to parse the full JSON because the outer object has nested
    # braces ({"name": ..., "arguments": {"query": ...}}) which a simple
    # non-nested regex can't match, and a full JSON parse is fragile against
    # the truncated/malformed output these models tend to produce.
    if "search_catalog" not in text:
        return None
    match = re.search(r'"query"\s*:\s*"([^"]+)"', text)
    return match.group(1) if match else None


def _build_messages(request: ChatRequest) -> list[dict[str, Any]]:
    history = list(request.messages)

    # If there's an image, attach it to the last user message
    if request.image and history and history[-1].role == "user":
        try:
            raw = base64.b64decode(request.image)
        except binascii.Error:
            raw = b""

        mime = _detect_mime_type(raw)
        last = history.pop()
        messages_so_far = [{"role": m.role, "content": m.content} for m in history]
        messages_so_far.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{request.image}"},
                    },
                    {"type": "text", "text": last.content or "What is this?"},
                ],
            }
        )
        return messages_so_far

    return [{"role": m.role, "content": m.content} for m in history]


async def run_agent(request: ChatRequest, store: CatalogStore) -> ChatResponse:
    messages = _build_messages(request)

    async with httpx.AsyncClient(timeout=60.0) as client:
        # --- Turn 1: may trigger tool call ---
        try:
            resp1 = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "HTTP-Referer": "https://github.com/pomelofruit/carty",
                },
                json={
                    "model": settings.openrouter_model,
                    "messages": [{"role": "system", "content": _SYSTEM_PROMPT}] + messages,
                    "tools": _TOOL_SCHEMA,
                    "tool_choice": "auto",
                },
            )
            resp1.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=502, detail="LLM service error") from exc

        data1 = resp1.json()
        choices1 = data1.get("choices", [])
        if not choices1:
            raise HTTPException(status_code=502, detail="LLM returned no choices")
        choice1 = choices1[0]
        msg1 = choice1["message"]

        products: list[Product] = []

        # Some models output tool calls as text instead of using the structured
        # tool_calls protocol. We handle both: the proper protocol first, then
        # a fallback that scans the reply text for an embedded query.
        text_content = msg1.get("content") or ""
        bad_query = _extract_text_tool_call_query(text_content)
        using_structured = choice1.get("finish_reason") == "tool_calls" and msg1.get("tool_calls")

        if using_structured:
            # Standard protocol: model set finish_reason="tool_calls" and
            # populated the tool_calls field correctly.
            tool_results: list[dict[str, Any]] = []
            for tc in msg1["tool_calls"]:
                fn = tc["function"]
                if fn["name"] == "search_catalog":
                    try:
                        args = json.loads(fn["arguments"])
                    except json.JSONDecodeError:
                        continue
                    hits = store.search(args["query"], top_k=settings.max_search_results)
                    products.extend(hits)
                    tool_results.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "content": json.dumps(
                                [
                                    {
                                        "id": p.id,
                                        "name": p.name,
                                        "category": p.category,
                                        "price": p.price,
                                        "description": p.description,
                                    }
                                    for p in hits
                                ]
                            ),
                        }
                    )

            # --- Turn 2: synthesise ---
            # Include msg1 as the protocol requires (it carries the tool_calls
            # field that Turn 2 needs to reference).
            turn2_messages = (
                [{"role": "system", "content": _SYSTEM_PROMPT}]
                + messages
                + [msg1]
                + tool_results
            )

        elif bad_query:
            # Fallback for non-compliant models: the model wrote the tool call
            # as plain text (e.g. TOOLCALL>[{...}]CALL>) instead of using the
            # structured protocol. We run the search manually using the query
            # we extracted, then inject results as a system message.
            # msg1 is intentionally omitted from Turn 2 — re-sending the
            # garbled text would confuse the model.
            hits = store.search(bad_query, top_k=settings.max_search_results)
            products.extend(hits)
            tool_results = [
                {
                    "role": "system",
                    "content": "search_catalog results:\n" + json.dumps(
                        [
                            {
                                "id": p.id,
                                "name": p.name,
                                "category": p.category,
                                "price": p.price,
                                "description": p.description,
                            }
                            for p in hits
                        ]
                    ),
                }
            ]
            turn2_messages = (
                [{"role": "system", "content": _SYSTEM_PROMPT}]
                + messages
                + tool_results
            )

        if using_structured or bad_query:
            try:
                resp2 = await client.post(
                    f"{settings.openrouter_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openrouter_api_key}",
                        "HTTP-Referer": "https://github.com/pomelofruit/carty",
                    },
                    json={
                        "model": settings.openrouter_model,
                        "messages": turn2_messages,
                    },
                )
                resp2.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise HTTPException(status_code=502, detail="LLM service error") from exc

            choices2 = resp2.json().get("choices", [])
            if not choices2:
                raise HTTPException(status_code=502, detail="LLM returned no choices")
            reply_text = choices2[0]["message"]["content"] or ""
        else:
            reply_text = msg1.get("content") or ""

    # Deduplicate products preserving order
    seen: set[str] = set()
    unique_products: list[Product] = []
    for p in products:
        if p.id not in seen:
            seen.add(p.id)
            unique_products.append(p)

    return ChatResponse(message=reply_text, products=unique_products)
