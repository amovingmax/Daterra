"""Scraper para /bares-e-restaurantes/ — fornecedores tipo *restaurant*."""

from __future__ import annotations

from ..http import CachedClient
from ..models import Product, Supplier
from ._common import scrape_listing


def scrape_restaurants(client: CachedClient) -> tuple[list[Supplier], list[Product]]:
    return scrape_listing("/bares-e-restaurantes/", "restaurant", client)
