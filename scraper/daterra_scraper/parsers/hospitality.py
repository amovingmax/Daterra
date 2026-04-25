"""Scraper para /hotelaria/ — fornecedores tipo *hospitality*."""

from __future__ import annotations

from ..http import CachedClient
from ..models import Product, Supplier
from ._common import scrape_listing


def scrape_hospitality(client: CachedClient) -> tuple[list[Supplier], list[Product]]:
    return scrape_listing("/hotelaria/", "hospitality", client)
