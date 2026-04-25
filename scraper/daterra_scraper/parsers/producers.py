"""Scraper para /produtores/ — fornecedores tipo *producer*."""

from __future__ import annotations

from ..http import CachedClient
from ..models import Product, Supplier
from ._common import scrape_listing


def scrape_producers(client: CachedClient) -> tuple[list[Supplier], list[Product]]:
    return scrape_listing("/produtores/", "producer", client)
