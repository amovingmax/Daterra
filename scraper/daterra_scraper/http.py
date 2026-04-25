"""Cliente HTTP com cache em disco e rate limit."""

from __future__ import annotations

import hashlib
import time
from pathlib import Path
from typing import Optional

import httpx

from . import DEFAULT_USER_AGENT


class CachedClient:
    """Wrapper httpx que cacheia GETs em disco e aplica rate limit."""

    def __init__(
        self,
        cache_dir: Path,
        delay: float = 1.0,
        user_agent: str = DEFAULT_USER_AGENT,
        timeout: float = 30.0,
    ) -> None:
        cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir = cache_dir
        self.delay = delay
        self._last_request_at = 0.0
        self._client = httpx.Client(
            headers={"User-Agent": user_agent},
            follow_redirects=True,
            timeout=timeout,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "CachedClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def get_html(self, url: str, force: bool = False) -> str:
        """GET com cache. Retorna o HTML como string."""
        cache_path = self._cache_path(url)
        if cache_path.exists() and not force:
            return cache_path.read_text(encoding="utf-8")

        self._respect_rate_limit()
        response = self._client.get(url)
        response.raise_for_status()
        text = response.text
        cache_path.write_text(text, encoding="utf-8")
        return text

    def get_bytes(self, url: str) -> Optional[bytes]:
        """GET binário (sem cache em disco — usado pra imagens, opcional)."""
        self._respect_rate_limit()
        try:
            response = self._client.get(url)
            response.raise_for_status()
            return response.content
        except httpx.HTTPError:
            return None

    def _cache_path(self, url: str) -> Path:
        digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]
        return self.cache_dir / f"{digest}.html"

    def _respect_rate_limit(self) -> None:
        elapsed = time.time() - self._last_request_at
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_request_at = time.time()
