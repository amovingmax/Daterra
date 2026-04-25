"""Helpers compartilhados pelos parsers do site Feito Potiguar."""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .. import BASE_URL
from ..http import CachedClient
from ..models import Product, Supplier, SupplierType
from ..normalize import (
    clean_text,
    extract_email,
    extract_instagram,
    extract_phone,
    extract_rn_city,
    slugify,
)

# Marker que separa o conteúdo da empresa da seção "Mais Empresas" (carrossel
# de outras empresas relacionadas, comum a todas as páginas de detalhe).
RELATED_SECTION_MARKER = "Mais Empresas"

# Padrão de imagem real (fotos no /wp-content/uploads/ de 2025+, excluindo logos do site).
PRODUCT_IMAGE_PATTERN = re.compile(
    r'src="(https://feitopotiguar\.com\.br/wp-content/uploads/202[5-9]/[^"]+'
    r'\.(?:jpg|jpeg|png|webp))"',
    re.IGNORECASE,
)

# Pattern de produto: "<nome> – <empresa>" no <h2> (en-dash &#8211; → "–")
PRODUCT_TITLE_SEPARATOR = "–"


@dataclass
class EmpresaScrape:
    supplier: Supplier
    products: list[Product]


def fetch_empresa_links(client: CachedClient, listing_path: str) -> list[str]:
    """Extrai URLs /empresa/<slug>/ a partir de uma página de listagem."""
    html = client.get_html(urljoin(BASE_URL, listing_path))
    return _empresa_urls_in_html(html)


def _empresa_urls_in_html(html: str) -> list[str]:
    pattern = re.compile(
        r'href="(https://feitopotiguar\.com\.br/empresa/[a-z0-9][a-z0-9\-]+/)"',
        re.IGNORECASE,
    )
    seen: set[str] = set()
    for match in pattern.finditer(html):
        seen.add(match.group(1))
    return sorted(seen)


def _slice_before_related(html: str) -> str:
    """Retorna apenas a parte do HTML anterior à seção 'Mais Empresas'."""
    idx = html.find(RELATED_SECTION_MARKER)
    return html if idx < 0 else html[:idx]


def parse_empresa_page(
    client: CachedClient,
    url: str,
    supplier_type: SupplierType,
) -> EmpresaScrape | None:
    """Parser direcionado para páginas /empresa/<slug>/ do Feito Potiguar."""
    try:
        full_html = client.get_html(url)
    except Exception:
        return None

    own_html = _slice_before_related(full_html)
    soup = BeautifulSoup(own_html, "lxml")

    name_el = soup.select_one("h1")
    name = clean_text(name_el.get_text()) if name_el else None
    if not name:
        return None

    slug = url.rstrip("/").rsplit("/", 1)[-1]

    # Texto plano da seção da empresa (tudo, incluindo descrição embaixo da hero)
    body_text = soup.get_text(" ", strip=True)

    # Cidade — formato "Macaíba - RN", "Natal/RN", etc.
    city = extract_rn_city(body_text)

    # Contatos: pega APENAS os primeiros que aparecem no slice da empresa
    phone: str | None = None
    whatsapp: str | None = None
    instagram: str | None = None
    email: str | None = None

    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if not isinstance(href, str):
            continue
        if href.startswith("tel:") and not phone:
            phone = extract_phone(href)
        elif href.startswith("mailto:") and not email:
            email = extract_email(href)
        elif "wa.me/" in href and not whatsapp:
            whatsapp = extract_phone(href)
        elif "instagram.com/" in href and not instagram:
            instagram = extract_instagram(href)

    # Imagem principal — primeira foto real no /wp-content/uploads/ recente,
    # ignorando logos e ícones do tema
    cover_url: str | None = None
    img_match = PRODUCT_IMAGE_PATTERN.search(own_html)
    if img_match:
        candidate = img_match.group(1)
        # ignorar variações de logo
        if "logo" not in candidate.lower() and "feito-com-gentileza" not in candidate.lower():
            cover_url = candidate

    # Descrição: pega o primeiro parágrafo significativo
    description: str | None = None
    for p in soup.select("p"):
        txt = clean_text(p.get_text(" ", strip=True))
        if txt and len(txt) > 60:
            description = txt[:600]
            break

    supplier = Supplier(
        slug=slug,
        name=name,
        type=supplier_type,
        description=description,
        story=description,
        logo_url=None,
        cover_url=cover_url,
        primary_category=None,
        city=city,
        state="RN",
        phone=phone,
        whatsapp=whatsapp,
        email=email,
        instagram=instagram,
        source_url=url,
        raw_categories=[],
    )

    products = _extract_products(soup, supplier_slug=slug, supplier_name=name, source_url=url)

    return EmpresaScrape(supplier=supplier, products=products)


def _extract_products(
    soup: BeautifulSoup,
    supplier_slug: str,
    supplier_name: str,
    source_url: str,
) -> list[Product]:
    """Extrai produtos a partir dos H2 dentro da página da empresa.

    Os produtos vêm rotulados como "<Nome do Produto> – <Nome da Empresa>".
    Usamos o sufixo da empresa pra distinguir de H2 de seção (Contato,
    Produtos vendidos, etc.).
    """
    products: list[Product] = []
    seen_slugs: set[str] = set()

    for h2 in soup.select("h2"):
        raw = clean_text(h2.get_text())
        if not raw or PRODUCT_TITLE_SEPARATOR not in raw:
            continue
        # divide em "[name] – [empresa]"
        left, _, right = raw.rpartition(PRODUCT_TITLE_SEPARATOR)
        product_name = clean_text(left)
        empresa_in_title = clean_text(right)
        if not product_name or not empresa_in_title:
            continue
        # confere que o sufixo bate com o nome da empresa (case-insensitive)
        if empresa_in_title.lower() != supplier_name.lower():
            continue

        product_slug = slugify(f"{supplier_slug}-{product_name}")
        if product_slug in seen_slugs:
            continue
        seen_slugs.add(product_slug)

        # Imagem mais próxima — pega a primeira <img> dentro do mesmo "section"
        # ancestral, fallback pra None
        photo_url: str | None = None
        section = h2.find_parent(["section", "div", "article"])
        if section:
            img = section.select_one("img[src]")
            if img and img.has_attr("src"):
                src = img["src"]
                if isinstance(src, str) and "wp-content/uploads" in src:
                    photo_url = src

        products.append(
            Product(
                slug=product_slug,
                name=product_name,
                supplier_slug=supplier_slug,
                description=None,
                photo_url=photo_url,
                source_url=source_url,
            )
        )

    return products


def scrape_listing(
    listing_path: str,
    supplier_type: SupplierType,
    client: CachedClient,
) -> tuple[list[Supplier], list[Product]]:
    """Pipeline completo: listing → empresas → suppliers + products."""
    suppliers: dict[str, Supplier] = {}
    products: dict[str, Product] = {}

    for url in fetch_empresa_links(client, listing_path):
        scraped = parse_empresa_page(client, url, supplier_type)
        if not scraped:
            continue
        suppliers.setdefault(scraped.supplier.slug, scraped.supplier)
        for p in scraped.products:
            products.setdefault(p.slug, p)

    return list(suppliers.values()), list(products.values())
