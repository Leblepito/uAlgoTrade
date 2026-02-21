"""LLM provider abstraction — supports Gemini (primary), Anthropic Claude, and OpenAI-compatible APIs."""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger(__name__)


@dataclass
class LLMConfig:
    provider: str = "gemini"                    # gemini | anthropic | openai | custom
    api_key: str = ""
    model: str = ""
    base_url: str = ""
    max_tokens: int = 2048
    temperature: float = 0.7

    def __post_init__(self):
        if not self.api_key:
            if self.provider == "gemini":
                self.api_key = os.getenv("GEMINI_API_KEY", "")
            elif self.provider == "anthropic":
                self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
            else:
                self.api_key = os.getenv("OPENAI_API_KEY", "")

        if not self.model:
            if self.provider == "gemini":
                self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            elif self.provider == "anthropic":
                self.model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
            else:
                self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        if not self.base_url:
            if self.provider == "gemini":
                self.base_url = "https://generativelanguage.googleapis.com"
            elif self.provider == "anthropic":
                self.base_url = "https://api.anthropic.com"
            elif self.provider == "openai":
                self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com")
            else:
                self.base_url = os.getenv("LLM_BASE_URL", "")


@dataclass
class LLMResponse:
    content: str = ""
    tokens_used: int = 0
    model: str = ""
    provider: str = ""
    raw: dict = field(default_factory=dict)


class LLMProvider:
    """Unified LLM interface — Gemini, Claude, OpenAI."""

    def __init__(self, config: LLMConfig | None = None):
        self.config = config or LLMConfig(
            provider=os.getenv("LLM_PROVIDER", "gemini")
        )
        self._client = httpx.AsyncClient(timeout=120.0)

    @property
    def provider_name(self) -> str:
        return self.config.provider

    async def chat(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float | None = None,
        max_tokens: int | None = None,
        json_mode: bool = False,
    ) -> LLMResponse:
        """Send a chat completion request to the configured provider."""
        temp = temperature if temperature is not None else self.config.temperature
        tokens = max_tokens or self.config.max_tokens

        if self.config.provider == "gemini":
            return await self._call_gemini(system_prompt, user_message, temp, tokens, json_mode)
        elif self.config.provider == "anthropic":
            return await self._call_anthropic(system_prompt, user_message, temp, tokens)
        else:
            return await self._call_openai(system_prompt, user_message, temp, tokens, json_mode)

    async def chat_json(self, system_prompt: str, user_message: str) -> dict:
        """Chat and parse response as JSON."""
        resp = await self.chat(
            system_prompt=system_prompt + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation.",
            user_message=user_message,
            json_mode=True,
        )
        text = resp.content.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0]
        return json.loads(text)

    # ── Gemini (Google AI) ────────────────────────────────

    async def _call_gemini(
        self, system: str, user: str, temperature: float, max_tokens: int, json_mode: bool
    ) -> LLMResponse:
        url = (
            f"{self.config.base_url}/v1beta/models/{self.config.model}:generateContent"
            f"?key={self.config.api_key}"
        )
        body: dict = {
            "systemInstruction": {
                "parts": [{"text": system}]
            },
            "contents": [
                {"role": "user", "parts": [{"text": user}]}
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"

        resp = await self._client.post(
            url,
            json=body,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()

        # Extract text from Gemini response
        candidates = data.get("candidates", [])
        text = ""
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            text = parts[0].get("text", "") if parts else ""

        usage = data.get("usageMetadata", {})
        tokens = usage.get("promptTokenCount", 0) + usage.get("candidatesTokenCount", 0)

        return LLMResponse(
            content=text,
            tokens_used=tokens,
            model=self.config.model,
            provider="gemini",
            raw=data,
        )

    # ── Anthropic (Claude) ────────────────────────────────

    async def _call_anthropic(
        self, system: str, user: str, temperature: float, max_tokens: int
    ) -> LLMResponse:
        url = f"{self.config.base_url}/v1/messages"
        headers = {
            "x-api-key": self.config.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.config.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }

        resp = await self._client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()

        usage = data.get("usage", {})
        return LLMResponse(
            content=data["content"][0]["text"],
            tokens_used=usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            model=data.get("model", self.config.model),
            provider="anthropic",
            raw=data,
        )

    # ── OpenAI / OpenAI-compatible ────────────────────────

    async def _call_openai(
        self, system: str, user: str, temperature: float, max_tokens: int, json_mode: bool
    ) -> LLMResponse:
        url = f"{self.config.base_url}/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }
        body: dict = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        resp = await self._client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()

        usage = data.get("usage", {})
        return LLMResponse(
            content=data["choices"][0]["message"]["content"],
            tokens_used=usage.get("total_tokens", 0),
            model=data.get("model", self.config.model),
            provider="openai",
            raw=data,
        )

    async def close(self):
        await self._client.aclose()
