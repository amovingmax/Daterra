"""Importa os JSONs gerados pelo scraper para o Supabase.

Uso:
    python -m daterra_scraper.import_to_supabase \
        --supabase-url "$SUPABASE_URL" \
        --supabase-service-key "$SUPABASE_SERVICE_ROLE_KEY"

> Use sempre a service_role key — políticas RLS bloqueiam upsert anônimo.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import typer
from dotenv import load_dotenv
from rich.console import Console
from supabase import Client, create_client

app = typer.Typer(add_completion=False)
console = Console()

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"


def _load_json(filename: str) -> list[dict[str, Any]]:
    path = OUTPUT_DIR / filename
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _today_iso() -> str:
    from datetime import date

    return date.today().isoformat()


def _normalize_supplier(item: dict[str, Any]) -> dict[str, Any]:
    """Mapeia o JSON do scraper pro shape da tabela suppliers."""
    return {
        "slug": item["slug"],
        "name": item["name"],
        "type": item["type"],
        "cnpj": (item.get("cnpj") or "").ljust(14, "0")[:14],  # placeholder até CNPJ real
        "description": item.get("description"),
        "story": item.get("story"),
        "logo_url": item.get("logo_url"),
        "cover_url": item.get("cover_url"),
        "city": item.get("city") or "Natal",
        "state": "RN",
        "whatsapp": item.get("whatsapp"),
        "instagram": item.get("instagram"),
        "email": item.get("email"),
        "feito_potiguar_certified_at": _today_iso(),
        "is_active": False,  # ativação manual após validação Da Terra
        "source": "feito_potiguar_scrape",
        "source_url": item.get("source_url"),
    }


def _upsert_chunked(
    supabase: Client,
    table: str,
    rows: list[dict[str, Any]],
    on_conflict: str,
    chunk_size: int = 100,
) -> int:
    inserted = 0
    for i in range(0, len(rows), chunk_size):
        batch = rows[i : i + chunk_size]
        response = supabase.table(table).upsert(batch, on_conflict=on_conflict).execute()
        if response.data:
            inserted += len(response.data)
    return inserted


@app.command()
def main(
    supabase_url: str = typer.Option(..., envvar="SUPABASE_URL"),
    supabase_service_key: str = typer.Option(..., envvar="SUPABASE_SERVICE_ROLE_KEY"),
    activate: bool = typer.Option(False, help="Ativa fornecedores no upsert (is_active=true)."),
) -> None:
    load_dotenv()
    supabase = create_client(supabase_url, supabase_service_key)

    suppliers_raw = _load_json("suppliers.json")
    if not suppliers_raw:
        console.print("[yellow]suppliers.json vazio. Rode `python -m daterra_scraper.cli all` antes.[/]")
        raise typer.Exit(1)

    suppliers = [_normalize_supplier(s) for s in suppliers_raw]
    if activate:
        for s in suppliers:
            s["is_active"] = True

    console.print(f"Upserting [cyan]{len(suppliers)}[/] fornecedores em suppliers...")
    count = _upsert_chunked(supabase, "suppliers", suppliers, on_conflict="slug")
    console.print(f"[bold green]✓[/] {count} suppliers gravados")

    products_raw = _load_json("products.json")
    if not products_raw:
        console.print("[yellow]products.json vazio — pulando[/]")
        return

    # produtos precisam do supplier_id resolvido
    slugs = {p["supplier_slug"] for p in products_raw if p.get("supplier_slug")}
    suppliers_map: dict[str, str] = {}
    for slug_chunk in [list(slugs)[i : i + 50] for i in range(0, len(slugs), 50)]:
        rows = (
            supabase.table("suppliers")
            .select("id, slug")
            .in_("slug", slug_chunk)
            .execute()
            .data
            or []
        )
        for r in rows:
            suppliers_map[r["slug"]] = r["id"]

    products: list[dict[str, Any]] = []
    for p in products_raw:
        supplier_id = suppliers_map.get(p.get("supplier_slug", ""))
        if not supplier_id:
            continue
        products.append(
            {
                "supplier_id": supplier_id,
                "slug": p["slug"],
                "name": p["name"],
                "description": p.get("description"),
                "price_cents": 0,  # placeholder — será editado pelo fornecedor
                "photos": [p["photo_url"]] if p.get("photo_url") else [],
                "is_active": False,
                "source": "feito_potiguar_scrape",
                "source_url": p.get("source_url"),
            }
        )

    if products:
        console.print(f"Upserting [cyan]{len(products)}[/] produtos...")
        count = _upsert_chunked(
            supabase, "products", products, on_conflict="supplier_id,slug"
        )
        console.print(f"[bold green]✓[/] {count} products gravados")


if __name__ == "__main__":
    app()
