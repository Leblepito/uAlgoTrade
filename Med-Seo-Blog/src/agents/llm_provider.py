"""
Med-Seo-Blog — Multi-LLM Provider
Gemini, Anthropic ve OpenAI destegi.
"""
from __future__ import annotations

import logging
from typing import Any

from src import config

logger = logging.getLogger("med-seo-blog.llm")


async def call_gemini(prompt: str, system: str = "", model: str | None = None) -> str:
    """Google Gemini API call."""
    if not config.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    from google import genai

    client = genai.Client(api_key=config.GEMINI_API_KEY)
    use_model = model or config.GEMINI_MODEL

    contents = prompt
    if system:
        contents = f"{system}\n\n{prompt}"

    response = client.models.generate_content(model=use_model, contents=contents)
    return response.text or ""


async def call_anthropic(prompt: str, system: str = "", model: str | None = None) -> str:
    """Anthropic Claude API call."""
    if not config.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")

    import anthropic

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    use_model = model or config.ANTHROPIC_MODEL

    kwargs: dict[str, Any] = {
        "model": use_model,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        kwargs["system"] = system

    message = client.messages.create(**kwargs)
    return message.content[0].text if message.content else ""


async def call_openai(prompt: str, system: str = "", model: str | None = None) -> str:
    """OpenAI API call."""
    if not config.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not configured")

    import openai

    client = openai.OpenAI(api_key=config.OPENAI_API_KEY)
    use_model = model or config.OPENAI_MODEL

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(model=use_model, messages=messages)
    return response.choices[0].message.content or ""


def check_gemini() -> bool:
    return bool(config.GEMINI_API_KEY)


def check_anthropic() -> bool:
    return bool(config.ANTHROPIC_API_KEY)


def check_openai() -> bool:
    return bool(config.OPENAI_API_KEY)
