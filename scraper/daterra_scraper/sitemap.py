"""Lista URLs do site Feito Potiguar via sitemap XML.

O sitemap é o source of truth — tem 161 empresas (vs 30 que aparecem nas
listagens públicas) e ~292 produtos individuais.
"""

from __future__ import annotations

import re
from typing import Iterator

import httpx

from . import BASE_URL, DEFAULT_USER_AGENT


_LOC_RE = re.compile(r"<loc>([^<]+)</loc>")


def _fetch_sitemap_locs(url: str) -> list[str]:
    response = httpx.get(url, headers={"User-Agent": DEFAULT_USER_AGENT}, timeout=30.0)
    response.raise_for_status()
    return _LOC_RE.findall(response.text)


def list_empresa_urls() -> list[str]:
    """Retorna URLs únicas de páginas /empresa/<slug>/."""
    locs = _fetch_sitemap_locs(f"{BASE_URL}/empresa-sitemap.xml")
    seen: set[str] = set()
    out: list[str] = []
    for loc in locs:
        if "/empresa/" not in loc:
            continue
        # Pula a URL raiz /empresa/
        slug = loc.rstrip("/").rsplit("/", 1)[-1]
        if not slug or slug == "empresa":
            continue
        canonical = f"{BASE_URL}/empresa/{slug}/"
        if canonical in seen:
            continue
        seen.add(canonical)
        out.append(canonical)
    return out


def list_product_urls() -> list[str]:
    """Retorna URLs únicas de páginas /post-produtos/<slug>/.

    Há 2 sitemaps numerados (~200 + ~92 produtos).
    """
    seen: set[str] = set()
    out: list[str] = []
    for n in (1, 2):
        try:
            locs = _fetch_sitemap_locs(f"{BASE_URL}/post-produtos-sitemap{n}.xml")
        except httpx.HTTPError:
            continue
        for loc in locs:
            if "/post-produtos/" not in loc:
                continue
            slug = loc.rstrip("/").rsplit("/", 1)[-1]
            if not slug or slug == "post-produtos":
                continue
            canonical = f"{BASE_URL}/post-produtos/{slug}/"
            if canonical in seen:
                continue
            seen.add(canonical)
            out.append(canonical)
    return out
