"""Scraper para /produtores/ — fornecedores tipo *producer*."""

from __future__ import annotations

from ..http import CachedClient
from ..models import Supplier
from ._common import dedupe_suppliers, scrape_section


def scrape_producers(client: CachedClient) -> list[Supplier]:
    return dedupe_suppliers(scrape_section("/produtores/", "producer", client))
