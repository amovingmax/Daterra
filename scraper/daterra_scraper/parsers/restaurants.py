"""Scraper para /bares-e-restaurantes/ — fornecedores tipo *restaurant*."""

from __future__ import annotations

from ..http import CachedClient
from ..models import Supplier
from ._common import dedupe_suppliers, scrape_section


def scrape_restaurants(client: CachedClient) -> list[Supplier]:
    return dedupe_suppliers(scrape_section("/bares-e-restaurantes/", "restaurant", client))
