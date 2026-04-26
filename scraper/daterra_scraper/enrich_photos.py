"""Enriquece fornecedores com a foto/logo do site Feito Potiguar.

Itera sobre suppliers do banco com logo_url IS NULL, busca o HTML da
página da empresa e extrai a primeira imagem hero (filtrando logos do site).
"""

from __future__ import annotations

import re
import time
from typing import Any

import httpx
import typer
from rich.console import Console
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)
from supabase import create_client

from . import DEFAULT_USER_AGENT

app = typer.Typer(add_completion=False)
console = Console()

# Imagens do site (logo, decoração) que NÃO são fotos de fornecedor
_FILTER_PATTERNS = (
    "logo-03",
    "feito-com-gentileza",
    "t2056F2sE1YyefQpJmOmIybwm4o",
    "placeholder",
)

_IMG_RE = re.compile(
    r'(?:data-src|src)="(https://feitopotiguar\.com\.br/wp-content/uploads/[^"]+\.(?:jpg|jpeg|png|webp))"',
    re.IGNORECASE,
)


def _extract_hero_image(html: str) -> str | None:
    seen: set[str] = set()
    for match in _IMG_RE.finditer(html):
        url = match.group(1)
        if url in seen:
            continue
        seen.add(url)
        if any(p in url for p in _FILTER_PATTERNS):
            continue
        return url
    return None


@app.command()
def main(
    supabase_url: str = typer.Option(..., envvar="SUPABASE_URL"),
    supabase_service_key: str = typer.Option(..., envvar="SUPABASE_SERVICE_ROLE_KEY"),
    delay: float = typer.Option(0.3, help="Delay entre requests em segundos"),
    limit: int = typer.Option(0, help="Limita quantos enriquecer (0 = todos)"),
    overwrite: bool = typer.Option(
        False, help="Atualiza mesmo quem já tem logo_url (cuidado: pode sobrescrever upload do admin)"
    ),
) -> None:
    supabase = create_client(supabase_url, supabase_service_key)

    query = (
        supabase.table("suppliers")
        .select("id, slug, source_url, logo_url")
        .not_.is_("source_url", "null")
    )
    if not overwrite:
        query = query.is_("logo_url", "null")

    rows = query.execute().data or []
    if limit > 0:
        rows = rows[:limit]

    console.print(f"[cyan]Enriquecendo {len(rows)} fornecedores...[/]")

    client = httpx.Client(headers={"User-Agent": DEFAULT_USER_AGENT}, timeout=20.0)

    updated = 0
    skipped = 0
    failed: list[str] = []
    last_request = 0.0

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Extraindo fotos...", total=len(rows))
        for row in rows:
            elapsed = time.time() - last_request
            if elapsed < delay:
                time.sleep(delay - elapsed)
            last_request = time.time()

            url = row.get("source_url")
            if not url:
                skipped += 1
                progress.advance(task)
                continue

            try:
                response = client.get(url)
                response.raise_for_status()
            except httpx.HTTPError:
                failed.append(row["slug"])
                progress.advance(task)
                continue

            hero = _extract_hero_image(response.text)
            if not hero:
                skipped += 1
                progress.advance(task)
                continue

            # Atualiza logo_url e cover_url (mesma imagem por enquanto — site só tem uma)
            payload: dict[str, Any] = {"logo_url": hero, "cover_url": hero}
            supabase.table("suppliers").update(payload).eq("id", row["id"]).execute()
            updated += 1
            progress.advance(task)

    client.close()
    console.print(f"\n[bold green]✓[/] {updated} fornecedores atualizados")
    if skipped:
        console.print(f"[yellow]⚠[/] {skipped} pulados (sem foto detectável)")
    if failed:
        console.print(f"[red]✗[/] {len(failed)} falharam: {', '.join(failed[:5])}")


if __name__ == "__main__":
    app()
