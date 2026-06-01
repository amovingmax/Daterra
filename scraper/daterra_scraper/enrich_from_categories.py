"""Enriquece banco com produtos e categorias a partir das páginas de
categoria-produto do site Feito Potiguar.

Por que: a página de cada empresa ("/empresa/<slug>/") frequentemente NÃO lista
todos os produtos da empresa — várias têm a seção "Produtos vendidos" vazia
ou parcial. A fonte completa de produtos é a página de categoria
("/categoria-produto/<cat>/"), que lista todos os produtos daquela categoria
junto com sua empresa.

Pipeline:
    1. Itera as 6 categorias-produto do site
    2. Extrai (produto-slug, supplier-slug) de cada listagem
    3. Resolve supplier_id pelo slug; se faltar produto, busca a página do
       produto pra extrair nome + insere no banco (idempotente)
    4. Atualiza primary_category do supplier baseado na categoria oficial
       do site (autoridade > heurística do nome)
"""

from __future__ import annotations

import html
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

from .normalize import slugify

app = typer.Typer(add_completion=False)
console = Console()

# UA realista — o Feito Potiguar bloqueia o UA "DaTerraBot" com 403
_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# Categoria do site → slug do programa (FEITO_POTIGUAR_CATEGORIES). O site
# agrupa "conservas-doces-e-temperos" numa URL só; o programa separa em duas
# categorias. Como os produtos listados ali são doces na prática, mapeamos
# todos pra doces-e-temperos. A categoria singular "conserva" do site fica
# pra conservas.
SITE_CATEGORY_MAP: dict[str, str] = {
    "alimentos-naturais-e-manufaturados": "alimentos-naturais",
    "alimentos-prontos": "alimentos-prontos",
    "bebidas": "bebidas",
    "conserva": "conservas",
    "conservas-doces-e-temperos": "doces-e-temperos",
    "produtos-de-origem-animal": "origem-animal",
}

_PRODUCT_LINK_RE = re.compile(
    r'href="https://feitopotiguar\.com\.br/post-produtos/([a-z0-9\-]+)/?"',
    re.IGNORECASE,
)
_H1_RE = re.compile(r"<h1[^>]*>([^<]+)</h1>", re.IGNORECASE | re.DOTALL)
_EMPRESA_LINK_RE = re.compile(
    r'/empresa/([a-z0-9\-]+)/', re.IGNORECASE
)


def _get_with_retry(client: httpx.Client, url: str, retries: int = 3) -> httpx.Response | None:
    """GET com retry exponencial pra timeouts/5xx — o site rate-limita
    quando recebe muitas requests em sequência."""
    delay = 2.0
    for attempt in range(retries):
        try:
            r = client.get(url)
            if r.status_code == 404:
                return r
            if 500 <= r.status_code < 600:
                raise httpx.HTTPError(f"http {r.status_code}")
            r.raise_for_status()
            return r
        except (httpx.TimeoutException, httpx.HTTPError):
            if attempt == retries - 1:
                return None
            time.sleep(delay)
            delay *= 2
    return None


def _list_category_products(client: httpx.Client, site_cat: str) -> list[str]:
    """Itera todas as páginas da categoria até esgotar (404 ou página vazia).
    O site usa paginação WordPress padrão: /page/N/. Alimentos Naturais tem
    10 páginas (~10 produtos por página)."""
    base = f"https://feitopotiguar.com.br/categoria-produto/{site_cat}"
    slugs: list[str] = []
    seen: set[str] = set()
    page = 1
    while True:
        suffix = "/" if page == 1 else f"/page/{page}/"
        r = _get_with_retry(client, base + suffix)
        if r is None:
            break
        if r.status_code == 404:
            break
        page_slugs = []
        for m in _PRODUCT_LINK_RE.finditer(r.text):
            s = m.group(1)
            if s in seen:
                continue
            seen.add(s)
            page_slugs.append(s)
        if not page_slugs:
            break
        slugs.extend(page_slugs)
        page += 1
        if page > 30:
            break
    return slugs


def _fetch_product_page(client: httpx.Client, product_site_slug: str) -> tuple[str, str | None, str | None] | None:
    """Retorna (product_name, supplier_name, supplier_slug) ou None.

    Primeiro tenta o h1, que tem 'Nome – Empresa' (en-dash via &#8211;).
    Quando o h1 não tem separador, usa o link /empresa/<slug>/ presente no
    body como fonte autoritativa do supplier_slug; o nome do produto fica
    sendo o h1 inteiro.
    """
    url = f"https://feitopotiguar.com.br/post-produtos/{product_site_slug}/"
    r = _get_with_retry(client, url)
    if r is None or r.status_code == 404:
        return None
    body = r.text

    # h1 sempre presente
    m = _H1_RE.search(body)
    if not m:
        return None
    title = re.sub(r"\s+", " ", html.unescape(m.group(1))).strip()

    # Caso clássico: "Nome – Empresa"
    if " – " in title:
        name, supplier = title.rsplit(" – ", 1)
        return name.strip(), supplier.strip(), None

    # Fallback: h1 só tem nome do produto. Pega supplier pelo primeiro link
    # /empresa/<slug>/ que aparece DEPOIS do menu (ignora os primeiros 4 que
    # são do menu de navegação superior).
    emp_links = _EMPRESA_LINK_RE.findall(body)
    # Primeiro slug que NÃO é do menu (menu tem links genéricos como
    # 'apoiadores', mas /empresa/<algo>/ no menu só aparece em
    # 'Empresas' breadcrumb — vamos pegar o primeiro slug "real")
    seen: set[str] = set()
    for slug in emp_links:
        if slug in seen:
            continue
        seen.add(slug)
        # Skip "empresa" raiz (não é um slug real)
        if slug in {"", "empresa"}:
            continue
        return title, None, slug

    return None


def _supplier_lookup(
    supabase: Any,
) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    """Devolve dois mapas: (por nome lowercase, por slug). Permite resolver
    supplier tanto pelo h1 ("Nome – Empresa") quanto pelo link /empresa/slug/
    (fallback)."""
    rows = (
        supabase.table("suppliers")
        .select("id, slug, name, primary_category")
        .execute()
        .data
        or []
    )
    by_name = {r["name"].lower().strip(): r for r in rows}
    by_slug = {r["slug"]: r for r in rows}
    return by_name, by_slug


def _all_existing_products(supabase: Any) -> set[tuple[str, str]]:
    """Carrega todos os (supplier_id, slug) de produtos existentes em UMA
    consulta. Antes fazíamos uma query por produto/categoria — com 100+
    produtos isso saturava o Supabase (Cloudflare 522)."""
    out: set[tuple[str, str]] = set()
    page_size = 1000
    offset = 0
    while True:
        rows = (
            supabase.table("products")
            .select("supplier_id, slug")
            .range(offset, offset + page_size - 1)
            .execute()
            .data
            or []
        )
        if not rows:
            break
        for r in rows:
            out.add((r["supplier_id"], r["slug"]))
        if len(rows) < page_size:
            break
        offset += page_size
    return out


@app.command()
def main(
    supabase_url: str = typer.Option(..., envvar="SUPABASE_URL"),
    supabase_service_key: str = typer.Option(..., envvar="SUPABASE_SERVICE_ROLE_KEY"),
    delay: float = typer.Option(0.4, help="Delay entre requests"),
) -> None:
    supabase = create_client(supabase_url, supabase_service_key)
    suppliers_by_name, suppliers_by_slug = _supplier_lookup(supabase)
    existing_products = _all_existing_products(supabase)
    console.print(
        f"[cyan]{len(suppliers_by_name)} suppliers, "
        f"{len(existing_products)} produtos no banco[/]"
    )

    client = httpx.Client(headers={"User-Agent": _UA}, timeout=60.0, follow_redirects=True)
    last_request = 0.0

    products_inserted = 0
    products_skipped = 0
    suppliers_recategorized = 0
    suppliers_unknown: set[str] = set()
    products_no_h1: list[str] = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        for site_cat, program_cat in SITE_CATEGORY_MAP.items():
            console.print(f"\n[bold]→[/] [cyan]{site_cat}[/] → {program_cat}")
            try:
                product_slugs = _list_category_products(client, site_cat)
            except httpx.HTTPError as e:
                console.print(f"  [red]falhou: {e}[/]")
                continue

            task = progress.add_task(
                f"[cyan]Processando {site_cat}...", total=len(product_slugs)
            )

            for prod_site_slug in product_slugs:
                elapsed = time.time() - last_request
                if elapsed < delay:
                    time.sleep(delay - elapsed)
                last_request = time.time()

                fetched = _fetch_product_page(client, prod_site_slug)
                if not fetched:
                    products_no_h1.append(prod_site_slug)
                    progress.advance(task)
                    continue

                product_name, supplier_name, supplier_slug_hint = fetched
                supplier: dict[str, Any] | None = None
                if supplier_name:
                    supplier = suppliers_by_name.get(supplier_name.lower().strip())
                if not supplier and supplier_slug_hint:
                    supplier = suppliers_by_slug.get(supplier_slug_hint)
                if not supplier:
                    suppliers_unknown.add(supplier_name or supplier_slug_hint or prod_site_slug)
                    progress.advance(task)
                    continue

                # Categoria do supplier: a página da categoria do site é
                # autoridade. Atualiza se diferente.
                if supplier.get("primary_category") != program_cat:
                    supabase.table("suppliers").update(
                        {"primary_category": program_cat}
                    ).eq("id", supplier["id"]).execute()
                    supplier["primary_category"] = program_cat
                    suppliers_recategorized += 1

                # Produto: slug interno = slugify("supplier-slug + nome")
                product_slug = slugify(f"{supplier['slug']}-{product_name}")
                key = (supplier["id"], product_slug)
                if key in existing_products:
                    products_skipped += 1
                    progress.advance(task)
                    continue
                existing_products.add(key)

                # is_active fica false (default) porque a constraint
                # products_active_requires_price exige price_cents — admin
                # define o preço no painel antes de ativar pra venda.
                payload = {
                    "supplier_id": supplier["id"],
                    "slug": product_slug,
                    "name": product_name,
                    "source": "feito_potiguar_category_enrich",
                    "source_url": f"https://feitopotiguar.com.br/post-produtos/{prod_site_slug}/",
                }
                supabase.table("products").upsert(
                    payload, on_conflict="supplier_id,slug"
                ).execute()
                products_inserted += 1
                progress.advance(task)

            progress.remove_task(task)

    client.close()
    console.print(
        f"\n[bold green]✓[/] {products_inserted} produtos novos inseridos"
    )
    console.print(f"[dim]·[/] {products_skipped} já existiam (pulados)")
    console.print(
        f"[bold green]✓[/] {suppliers_recategorized} suppliers recategorizados"
    )
    if suppliers_unknown:
        console.print(
            f"[yellow]⚠[/] {len(suppliers_unknown)} fornecedores referenciados nas "
            f"páginas de categoria mas ausentes do banco:"
        )
        for n in sorted(suppliers_unknown):
            console.print(f"    · {n}")
    if products_no_h1:
        console.print(
            f"[yellow]⚠[/] {len(products_no_h1)} páginas de produto sem h1 parseável"
        )


if __name__ == "__main__":
    app()
