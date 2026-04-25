"""Scraper para /vitrine/ — produtos com fornecedor associado."""

from __future__ import annotations

from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .. import BASE_URL
from ..http import CachedClient
from ..models import Product
from ..normalize import clean_text, slugify
from ._common import fetch_listing_links


def scrape_products(client: CachedClient) -> list[Product]:
    detail_urls = fetch_listing_links(client, "/vitrine/")
    products: dict[str, Product] = {}

    for url in detail_urls:
        try:
            html = client.get_html(url)
        except Exception:
            continue

        soup = BeautifulSoup(html, "lxml")

        name_el = soup.select_one("h1, h2.title, .entry-title")
        name = clean_text(name_el.get_text()) if name_el else None
        if not name:
            continue

        photo_url: str | None = None
        img = soup.select_one(".entry-content img, .post-thumbnail img")
        if img and img.has_attr("src"):
            photo_url = urljoin(BASE_URL, img["src"])  # type: ignore[index]

        # tenta achar o fornecedor por links pra /produtores/<slug>
        supplier_slug: str | None = None
        for a in soup.select("a[href]"):
            href = a.get("href", "")
            if isinstance(href, str) and "/produtores/" in href:
                supplier_slug = href.rstrip("/").rsplit("/", 1)[-1]
                break

        if not supplier_slug:
            continue  # produto sem fornecedor não é seedável

        description_el = soup.select_one(".entry-content")
        description = (
            clean_text(description_el.get_text(" ", strip=True)) if description_el else None
        )

        slug = slugify(f"{supplier_slug}-{name}")
        products.setdefault(
            slug,
            Product(
                slug=slug,
                name=name,
                supplier_slug=supplier_slug,
                description=description,
                photo_url=photo_url,
                source_url=url,
            ),
        )

    return list(products.values())
