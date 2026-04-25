"""Wrapper para o CLI `browser-act` (stealth-extract).

Executa via subprocess. Retorna o markdown da página renderizada — bem mais
fácil de parsear que o HTML cru. Cache simples em disco para evitar refazer
chamadas (cada chamada inicia um browser headless e leva alguns segundos).
"""

from __future__ import annotations

import hashlib
import os
import subprocess
import time
from pathlib import Path
from typing import Optional


class BrowserActClient:
    def __init__(self, cache_dir: Path, delay: float = 0.5, timeout: int = 90) -> None:
        cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir = cache_dir
        self.delay = delay
        self.timeout = timeout
        self._last_request_at = 0.0
        # Garante que ~/.local/bin está no PATH (onde uv instalou o browser-act)
        local_bin = os.path.expanduser("~/.local/bin")
        path = os.environ.get("PATH", "")
        if local_bin not in path:
            os.environ["PATH"] = f"{local_bin}:{path}"

    def get_markdown(self, url: str, force: bool = False) -> Optional[str]:
        """Executa `browser-act stealth-extract` na URL e retorna o markdown."""
        cache_path = self._cache_path(url)
        if cache_path.exists() and not force:
            return cache_path.read_text(encoding="utf-8")

        self._respect_rate_limit()
        try:
            result = subprocess.run(
                ["browser-act", "stealth-extract", url, "--timeout", str(self.timeout)],
                capture_output=True,
                text=True,
                timeout=self.timeout + 30,
            )
        except subprocess.TimeoutExpired:
            return None

        if result.returncode != 0:
            # eslint do shell: imprime stderr pra debug mas não quebra
            print(f"[browser-act] erro em {url}: {result.stderr[:200]}")
            return None

        markdown = result.stdout
        # browser-act prefixa às vezes com "Downloading package..." na primeira chamada,
        # vamos limpar tudo antes do primeiro `*` ou `#` significativo
        for marker in ("# ", "* [Vitrine"):
            idx = markdown.find(marker)
            if idx > 0 and idx < 200:
                markdown = markdown[idx:]
                break

        cache_path.write_text(markdown, encoding="utf-8")
        return markdown

    def _cache_path(self, url: str) -> Path:
        digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]
        return self.cache_dir / f"{digest}.md"

    def _respect_rate_limit(self) -> None:
        elapsed = time.time() - self._last_request_at
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_request_at = time.time()
