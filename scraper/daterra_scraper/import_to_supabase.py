"""Importa os JSONs gerados pelo scraper para o Supabase.

Uso:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
        python -m daterra_scraper.import_to_supabase

> Use sempre a service_role key — políticas RLS bloqueiam upsert anônimo.

Idempotência:
    O importer pode rodar várias vezes. Campos editados pelo admin/fornecedor
    (CNPJ, is_active, preço, fotos próprias, etc.) NÃO são tocados em re-runs;
    apenas os dados raspados (nome, endereço, contatos, descrição) são
    atualizados. Isso é garantido omitindo campos protegidos do payload de
    upsert — Postgres ON CONFLICT só sobrescreve as colunas presentes no INSERT.
"""

from __future__ import annotations

import json
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


def _supplier_payload(item: dict[str, Any]) -> dict[str, Any]:
    """Payload para upsert de supplier.

    Inclui apenas campos raspados (seguros pra re-run). Campos admin-editados
    (cnpj, is_active, logo_url, cover_url, primary_category, pix_key,
    min_order_cents, avg_prep_minutes, delivery_radius_km, accepts_pickup)
    são omitidos pra não serem sobrescritos em re-imports.
    """
    contact_whatsapp = item.get("whatsapp") or item.get("phone")
    return {
        "slug": item["slug"],  # chave de upsert
        "name": item["name"],
        "type": item["type"],
        "description": item.get("description"),
        "story": item.get("story"),
        "street": item.get("street"),
        "number": item.get("number"),
        "complement": item.get("complement"),
        "district": item.get("district"),
        "city": item.get("city") or "Natal",
        "state": "RN",
        "zip_code": item.get("zip_code"),
        "whatsapp": contact_whatsapp,
        "instagram": item.get("instagram"),
        "email": item.get("email"),
        "feito_potiguar_certified_at": _today_iso(),
        "source": "feito_potiguar_scrape",
        "source_url": item.get("source_url"),
    }


def _product_payload(item: dict[str, Any], supplier_id: str) -> dict[str, Any]:
    """Payload para upsert de produto.

    Inclui apenas campos raspados (nome, descrição, source_url). Campos
    admin-editados (price_cents, is_active, promo_*, stock, weight_grams,
    shelf_life_days, ingredients, photos, variations, addons, category,
    subcategory, sku) são omitidos.
    """
    return {
        "supplier_id": supplier_id,  # FK
        "slug": item["slug"],  # chave de upsert
        "name": item["name"],
        "description": item.get("description"),
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
) -> None:
    load_dotenv()
    supabase = create_client(supabase_url, supabase_service_key)

    suppliers_raw = _load_json("suppliers.json")
    if not suppliers_raw:
        console.print(
            "[yellow]suppliers.json vazio. Rode `python -m daterra_scraper.cli all` antes.[/]"
        )
        raise typer.Exit(1)

    suppliers = [_supplier_payload(s) for s in suppliers_raw]

    console.print(f"Upserting [cyan]{len(suppliers)}[/] fornecedores em suppliers...")
    count = _upsert_chunked(supabase, "suppliers", suppliers, on_conflict="slug")
    console.print(f"[bold green]✓[/] {count} suppliers gravados (campos admin preservados)")

    # primary_category: backfill apenas para slugs cujo valor no banco é NULL
    # (preserva categorias já editadas pelo admin). Agrupa por categoria pra
    # rodar 1 UPDATE por categoria em vez de 1 por fornecedor.
    by_category: dict[str, list[str]] = {}
    for s in suppliers_raw:
        cat = s.get("primary_category")
        if not cat:
            continue
        by_category.setdefault(cat, []).append(s["slug"])

    if by_category:
        backfilled = 0
        for cat, slugs in by_category.items():
            for chunk in [slugs[i : i + 100] for i in range(0, len(slugs), 100)]:
                resp = (
                    supabase.table("suppliers")
                    .update({"primary_category": cat})
                    .in_("slug", chunk)
                    .is_("primary_category", "null")
                    .execute()
                )
                if resp.data:
                    backfilled += len(resp.data)
        console.print(
            f"[bold green]✓[/] {backfilled} primary_category preenchidos "
            f"(campos já editados pelo admin preservados)"
        )

    products_raw = _load_json("products.json")
    if not products_raw:
        console.print("[yellow]products.json vazio — pulando[/]")
        return

    # Resolve supplier_id por slug
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
        products.append(_product_payload(p, supplier_id))

    if products:
        console.print(f"Upserting [cyan]{len(products)}[/] produtos...")
        count = _upsert_chunked(
            supabase, "products", products, on_conflict="supplier_id,slug"
        )
        console.print(f"[bold green]✓[/] {count} products gravados (preço/ativo preservados)")


if __name__ == "__main__":
    app()
