"""CLI principal do scraper Da Terra (sitemap + browser-act).

Uso:
    python -m daterra_scraper.cli all          # raspa todas as empresas do sitemap
    python -m daterra_scraper.cli sitemap-test # só lista URLs do sitemap

Pré-requisitos:
    brew install uv
    uv tool install browser-act-cli --python 3.12
"""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.table import Table

from .browser_act import BrowserActClient
from .models import Product, Supplier
from .parsers._common import parse_empresa_page
from .sitemap import list_empresa_urls, list_product_urls

app = typer.Typer(add_completion=False, help="Scraper do Feito Potiguar para o Da Terra.")
console = Console()

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"
CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"


def _write_json(path: Path, data: list[Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = [asdict(item) if hasattr(item, "__dataclass_fields__") else item for item in data]
    path.write_text(json.dumps(serialized, ensure_ascii=False, indent=2), encoding="utf-8")


@app.command("sitemap-test")
def cmd_sitemap_test() -> None:
    """Lista URLs do sitemap (sem raspar nada)."""
    empresas = list_empresa_urls()
    produtos = list_product_urls()
    console.print(f"[bold green]✓[/] {len(empresas)} empresas no sitemap")
    console.print(f"[bold green]✓[/] {len(produtos)} produtos no sitemap")
    console.print(f"\nPrimeiras 5 empresas:")
    for url in empresas[:5]:
        console.print(f"  · {url}")


@app.command("all")
def cmd_all(
    delay: float = 0.3,
    limit: int = typer.Option(0, help="Limita quantas empresas processar (0 = todas)"),
) -> None:
    """Raspa todas as empresas listadas no sitemap."""
    empresas_urls = list_empresa_urls()
    if limit > 0:
        empresas_urls = empresas_urls[:limit]
    console.print(f"[cyan]Sitemap:[/] {len(empresas_urls)} empresas para processar")

    client = BrowserActClient(CACHE_DIR, delay=delay, timeout=60)

    suppliers: list[Supplier] = []
    products: list[Product] = []
    fails: list[str] = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Raspando empresas...", total=len(empresas_urls))
        for url in empresas_urls:
            scraped = parse_empresa_page(client, url)
            if scraped:
                suppliers.append(scraped.supplier)
                products.extend(scraped.products)
            else:
                fails.append(url)
            progress.advance(task)

    suppliers_by_slug: dict[str, Supplier] = {}
    for s in suppliers:
        suppliers_by_slug.setdefault(s.slug, s)
    suppliers_unique = list(suppliers_by_slug.values())

    products_by_slug: dict[str, Product] = {}
    for p in products:
        products_by_slug.setdefault(p.slug, p)
    products_unique = list(products_by_slug.values())

    _write_json(OUTPUT_DIR / "suppliers.json", suppliers_unique)
    _write_json(OUTPUT_DIR / "products.json", products_unique)

    # Tabela resumo
    by_type: dict[str, int] = {"producer": 0, "restaurant": 0, "hospitality": 0}
    for s in suppliers_unique:
        by_type[s.type] = by_type.get(s.type, 0) + 1

    table = Table(title="Resumo")
    table.add_column("Tipo")
    table.add_column("Qtd", justify="right")
    table.add_row("Produtores e agroindústrias", str(by_type["producer"]))
    table.add_row("Bares e restaurantes", str(by_type["restaurant"]))
    table.add_row("Hotelaria", str(by_type["hospitality"]))
    table.add_row("[bold]Total[/]", f"[bold]{len(suppliers_unique)}[/]")
    console.print(table)
    console.print(f"[bold green]✓[/] {len(products_unique)} produtos extraídos")
    if fails:
        console.print(f"[bold yellow]⚠[/] {len(fails)} empresas falharam:")
        for u in fails[:5]:
            console.print(f"  · {u}")
    console.print(f"Saída em: [cyan]{OUTPUT_DIR}[/]")


if __name__ == "__main__":
    app()
