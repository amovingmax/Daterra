"""Scraper para /hotelaria/ — fornecedores tipo *hospitality*."""

from __future__ import annotations

from ..http import CachedClient
from ..models import Supplier
from ._common import dedupe_suppliers, scrape_section


def scrape_hospitality(client: CachedClient) -> list[Supplier]:
    return dedupe_suppliers(scrape_section("/hotelaria/", "hospitality", client))
