"""CLI principal do scraper Da Terra.

Uso:
    python -m daterra_scraper.cli all
    python -m daterra_scraper.cli producers
    python -m daterra_scraper.cli restaurants
    python -m daterra_scraper.cli hospitality
    python -m daterra_scraper.cli products
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
from .parsers import scrape_hospitality, scrape_producers, scrape_products, scrape_restaurants

app = typer.Typer(add_completion=False, help="Scraper do Feito Potiguar para o Da Terra.")
console = Console()

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"
CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"


def _write_json(path: Path, data: list[Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = [asdict(item) if hasattr(item, "__dataclass_fields__") else item for item in data]
    path.write_text(
        json.dumps(serialized, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _print_summary(label: str, items: list[Any]) -> None:
    table = Table(title=f"{label} — {len(items)} encontrados")
    table.add_column("Slug", style="cyan", overflow="fold")
    table.add_column("Nome", style="white")
    table.add_column("Cidade", style="green")
    for it in items[:20]:
        table.add_row(
            getattr(it, "slug", "-"),
            getattr(it, "name", "-"),
            getattr(it, "city", "-") or "-",
        )
    if len(items) > 20:
        table.caption = f"... + {len(items) - 20} ocultos"
    console.print(table)


@app.command("producers")
def cmd_producers(delay: float = 1.0) -> None:
    """Raspa produtores."""
    with CachedClient(CACHE_DIR, delay=delay) as client:
        items = scrape_producers(client)
    _write_json(OUTPUT_DIR / "producers.json", items)
    _print_summary("Produtores", items)


@app.command("restaurants")
def cmd_restaurants(delay: float = 1.0) -> None:
    """Raspa bares e restaurantes."""
    with CachedClient(CACHE_DIR, delay=delay) as client:
        items = scrape_restaurants(client)
    _write_json(OUTPUT_DIR / "restaurants.json", items)
    _print_summary("Bares e Restaurantes", items)


@app.command("hospitality")
def cmd_hospitality(delay: float = 1.0) -> None:
    """Raspa hotelaria."""
    with CachedClient(CACHE_DIR, delay=delay) as client:
        items = scrape_hospitality(client)
    _write_json(OUTPUT_DIR / "hospitality.json", items)
    _print_summary("Hotelaria", items)


@app.command("products")
def cmd_products(delay: float = 1.0) -> None:
    """Raspa vitrine de produtos."""
    with CachedClient(CACHE_DIR, delay=delay) as client:
        items = scrape_products(client)
    _write_json(OUTPUT_DIR / "products.json", items)
    console.print(f"[bold green]✓[/] {len(items)} produtos extraídos")


@app.command("all")
def cmd_all(delay: float = 1.0) -> None:
    """Raspa tudo: produtores, restaurantes, hotelaria e produtos."""
    with CachedClient(CACHE_DIR, delay=delay) as client:
        producers = scrape_producers(client)
        _write_json(OUTPUT_DIR / "producers.json", producers)
        _print_summary("Produtores", producers)

        restaurants = scrape_restaurants(client)
        _write_json(OUTPUT_DIR / "restaurants.json", restaurants)
        _print_summary("Bares e Restaurantes", restaurants)

        hospitality = scrape_hospitality(client)
        _write_json(OUTPUT_DIR / "hospitality.json", hospitality)
        _print_summary("Hotelaria", hospitality)

        products = scrape_products(client)
        _write_json(OUTPUT_DIR / "products.json", products)
        console.print(f"[bold green]✓[/] {len(products)} produtos extraídos")

    suppliers = [*producers, *restaurants, *hospitality]
    _write_json(OUTPUT_DIR / "suppliers.json", suppliers)
    console.print(
        f"\n[bold green]Total:[/] {len(suppliers)} fornecedores · {len(products)} produtos\n"
        f"Saída em: [cyan]{OUTPUT_DIR}[/]"
    )


if __name__ == "__main__":
    app()
