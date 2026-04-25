"""Helpers compartilhados pelos parsers."""

from __future__ import annotations

from typing import Iterable, Iterator
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .. import BASE_URL
from ..http import CachedClient
from ..models import Supplier, SupplierType
from ..normalize import (
    clean_text,
    extract_email,
    extract_instagram,
    extract_phone,
    normalize_city,
    slugify,
)


def fetch_listing_links(client: CachedClient, listing_path: str) -> list[str]:
    """Extrai URLs de detalhe a partir de uma página de listagem."""
    html = client.get_html(urljoin(BASE_URL, listing_path))
    soup = BeautifulSoup(html, "lxml")

    links: set[str] = set()
    # estratégia genérica: links cujo href começa com listing_path/<slug>
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if not isinstance(href, str):
            continue
        if listing_path in href and href.rstrip("/") != listing_path.rstrip("/"):
            absolute = urljoin(BASE_URL, href)
            if absolute.rstrip("/") != urljoin(BASE_URL, listing_path).rstrip("/"):
                links.add(absolute)
    return sorted(links)


def parse_supplier_page(
    client: CachedClient,
    url: str,
    supplier_type: SupplierType,
) -> Supplier | None:
    """Parser conservador para uma página de detalhe de fornecedor."""
    try:
        html = client.get_html(url)
    except Exception:
        return None

    soup = BeautifulSoup(html, "lxml")

    name_el = soup.select_one("h1, h2.title, .entry-title")
    name = clean_text(name_el.get_text()) if name_el else None
    if not name:
        return None

    # logo / cover
    logo_url: str | None = None
    cover_url: str | None = None
    main_img = soup.select_one(".entry-content img, .post-thumbnail img, header img")
    if main_img and main_img.has_attr("src"):
        logo_url = urljoin(BASE_URL, main_img["src"])  # type: ignore[index]

    # texto sobre o fornecedor
    description_el = soup.select_one(".entry-content, article, main")
    description = clean_text(description_el.get_text(" ", strip=True)) if description_el else None
    if description and len(description) > 1000:
        description = description[:1000].rsplit(" ", 1)[0] + "…"

    # contatos
    phone = None
    email = None
    instagram = None
    whatsapp = None
    city = None

    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if not isinstance(href, str):
            continue
        if href.startswith("tel:"):
            phone = phone or extract_phone(href)
        elif href.startswith("mailto:"):
            email = email or extract_email(href)
        elif "instagram.com/" in href:
            instagram = instagram or extract_instagram(href)
        elif "wa.me/" in href or "whatsapp" in href:
            whatsapp = whatsapp or extract_phone(href)

    full_text = soup.get_text(" ", strip=True)
    if not phone:
        phone = extract_phone(full_text)
    if not email:
        email = extract_email(full_text)

    # cidade — melhor esforço, procura por "Natal/RN", "Mossoró - RN" etc.
    import re
    city_match = re.search(r"\b([A-ZÁ-Úa-zá-ú\s]+?)\s*[-/]\s*RN\b", full_text)
    if city_match:
        city = normalize_city(city_match.group(1))

    # categorias (tags / breadcrumbs)
    raw_categories: list[str] = []
    for tag in soup.select(".cat-links a, .post-categories a, .entry-categories a"):
        label = clean_text(tag.get_text())
        if label:
            raw_categories.append(label)

    return Supplier(
        slug=slugify(name),
        name=name,
        type=supplier_type,
        description=description,
        story=description,
        logo_url=logo_url,
        cover_url=cover_url,
        primary_category=raw_categories[0] if raw_categories else None,
        city=city,
        state="RN",
        phone=phone,
        whatsapp=whatsapp,
        email=email,
        instagram=instagram,
        source_url=url,
        raw_categories=raw_categories,
    )


def scrape_section(
    listing_path: str,
    supplier_type: SupplierType,
    client: CachedClient,
) -> Iterator[Supplier]:
    """Pipeline genérico: listing → detalhe → Supplier."""
    detail_urls = fetch_listing_links(client, listing_path)
    seen: set[str] = set()
    for url in detail_urls:
        slug_key = url.rstrip("/").rsplit("/", 1)[-1]
        if slug_key in seen:
            continue
        seen.add(slug_key)
        supplier = parse_supplier_page(client, url, supplier_type)
        if supplier:
            yield supplier


def dedupe_suppliers(suppliers: Iterable[Supplier]) -> list[Supplier]:
    """Mantém o primeiro de cada slug."""
    by_slug: dict[str, Supplier] = {}
    for s in suppliers:
        by_slug.setdefault(s.slug, s)
    return list(by_slug.values())
