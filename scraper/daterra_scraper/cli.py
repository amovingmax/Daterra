"""CLI principal do scraper Da Terra.

Uso:
    python -m daterra_scraper.cli all
    python -m daterra_scraper.cli producers
    python -m daterra_scraper.cli restaurants
    python -m daterra_scraper.cli hospitality
"""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

import typer
from rich.console import Console
from rich.table import Table

from .http import CachedClient
from .models import Product, Supplier
from .parsers import scrape_hospitality, scrape_producers, scrape_restaurants

app = typer.Typer(add_completion=False, help="Scraper do Feito Potiguar para o Da Terra.")
console = Console()

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"
CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"


def _write_json(path: Path, data: list[Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = [asdict(item) if hasattr(item, "__dataclass_fields__") else item for item in data]
    path.write_text(json.dumps(serialized, ensure_ascii=False, indent=2), encoding="utf-8")


def _print_suppliers(label: str, items: list[Supplier]) -> None:
    table = Table(title=f"{label} — {len(items)} fornecedores")
    table.add_column("Slug", style="cyan", overflow="fold")
    table.add_column("Nome", style="white")
    table.add_column("Cidade", style="green")
    table.add_column("Whatsapp", style="yellow")
    for s in items[:25]:
        table.add_row(s.slug, s.name, s.city or "-", s.whatsapp or "-")
    if len(items) > 25:
        table.caption = f"... + {len(items) - 25} ocultos"
    console.print(table)


def _summarize(label: str, suppliers: list[Supplier], products: list[Product]) -> None:
    console.print(
        f"[bold green]✓[/] {label}: {len(suppliers)} fornecedores · "
        f"{len(products)} produtos"
    )


@app.command("producers")
def cmd_producers(delay: float = 1.0) -> None:
    """Raspa produtores."""
    with CachedClient(CACHE_DIR, delay=delay) as client:
        suppliers, products = scrape_producers(client)
    _write_json(OUTPUT_DIR / "producers.json", suppliers)
    _write_json(OUTPUT_DIR / "products-producers.json", products)
    _print_suppliers("Produtores", suppliers)
    _summarize("Produtores", suppliers, products)


@app.command("restaurants")
def cmd_restaurants(delay: float = 1.0) -> None:
    """Raspa bares e restaurantes."""
    with CachedClient(CACHE_DIR, delay=delay) as client:
        suppliers, products = scrape_restaurants(client)
    _write_json(OUTPUT_DIR / "restaurants.json", suppliers)
    _write_json(OUTPUT_DIR / "products-restaurants.json", products)
    _print_suppliers("Bares e Restaurantes", suppliers)
    _summarize("Bares e Restaurantes", suppliers, products)


@app.command("hospitality")
def cmd_hospitality(delay: float = 1.0) -> None:
    """Raspa hotelaria."""
    with CachedClient(CACHE_DIR, delay=delay) as client:
        suppliers, products = scrape_hospitality(client)
    _write_json(OUTPUT_DIR / "hospitality.json", suppliers)
    _write_json(OUTPUT_DIR / "products-hospitality.json", products)
    _print_suppliers("Hotelaria", suppliers)
    _summarize("Hotelaria", suppliers, products)


@app.command("all")
def cmd_all(delay: float = 1.0) -> None:
    """Raspa tudo: produtores, restaurantes e hotelaria."""
    with CachedClient(CACHE_DIR, delay=delay) as client:
        producers, prod_products = scrape_producers(client)
        _write_json(OUTPUT_DIR / "producers.json", producers)
        _print_suppliers("Produtores", producers)

        restaurants, rest_products = scrape_restaurants(client)
        _write_json(OUTPUT_DIR / "restaurants.json", restaurants)
        _print_suppliers("Bares e Restaurantes", restaurants)

        hospitality, hosp_products = scrape_hospitality(client)
        _write_json(OUTPUT_DIR / "hospitality.json", hospitality)
        _print_suppliers("Hotelaria", hospitality)

    # Dedupe global por slug (uma empresa pode aparecer em mais de uma listagem)
    suppliers_by_slug: dict[str, Supplier] = {}
    for s in [*producers, *restaurants, *hospitality]:
        suppliers_by_slug.setdefault(s.slug, s)
    suppliers = list(suppliers_by_slug.values())

    products_by_slug: dict[str, Product] = {}
    for p in [*prod_products, *rest_products, *hosp_products]:
        products_by_slug.setdefault(p.slug, p)
    products = list(products_by_slug.values())

    _write_json(OUTPUT_DIR / "suppliers.json", suppliers)
    _write_json(OUTPUT_DIR / "products.json", products)

    console.print(
        f"\n[bold green]Total:[/] {len(suppliers)} fornecedores · {len(products)} produtos"
    )
    console.print(f"Saída em: [cyan]{OUTPUT_DIR}[/]")


if __name__ == "__main__":
    app()
