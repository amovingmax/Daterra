"""Parser de markdown gerado por browser-act stealth-extract.

Pipeline:
  sitemap (httpx) → URLs de empresa → browser-act extract → parse markdown
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from ..browser_act import BrowserActClient
from ..models import Product, Supplier, SupplierType
from ..normalize import (
    clean_text,
    extract_email,
    extract_phone,
    extract_rn_city,
    slugify,
)

RELATED_SECTION_MARKER = "## Mais Empresas"
PRODUCT_TITLE_SEPARATOR = " – "
EMPRESA_LINK_RE = re.compile(
    r"https://feitopotiguar\.com\.br/empresa/([a-z0-9][a-z0-9\-]+)/?",
    re.IGNORECASE,
)
PRODUTO_LINK_RE = re.compile(
    r"\(https://feitopotiguar\.com\.br/post-produtos/([a-z0-9\-]+)/?\)",
    re.IGNORECASE,
)

# Mapeia o texto de tipo do site → SupplierType do nosso domínio
TYPE_MAP: dict[str, SupplierType] = {
    "agroindústria": "producer",
    "agroindustria": "producer",
    "produtor rural": "producer",
    "indústria": "producer",
    "industria": "producer",
    "alimentos naturais": "producer",
    "alimentos prontos": "producer",
    "produtos de origem animal": "producer",
    "origem animal": "producer",
    "doces e temperos": "producer",
    "bebidas": "producer",
    "conservas": "producer",
    "restaurante": "restaurant",
    "bar": "restaurant",
    "lanchonete": "restaurant",
    "padaria": "restaurant",
    "cafeteria": "restaurant",
    "pizzaria": "restaurant",
    "hotel": "hospitality",
    "pousada": "hospitality",
    "hostel": "hospitality",
    "resort": "hospitality",
    "hospedagem": "hospitality",
}

# Mapeia o texto de tipo do site → slug de FEITO_POTIGUAR_CATEGORIES.
# Ordem importa: "doces" antes de "conservas" pra label "Conservas, Doces e
# Temperos" cair em doces-e-temperos (bate primeiro o termo mais específico
# do programa). "alimentos prontos" antes de "alimentos naturais" pra mesma
# razão.
_CATEGORY_KEYWORDS: list[tuple[str, str]] = [
    ("alimentos prontos", "alimentos-prontos"),
    ("alimentos naturais", "alimentos-naturais"),
    ("origem animal", "origem-animal"),
    ("bebidas", "bebidas"),
    ("doces", "doces-e-temperos"),
    ("temperos", "doces-e-temperos"),
    ("conservas", "conservas"),
]

# Word-sets para detectar categoria pelo NOME do fornecedor — mais específico
# que o site_type_label genérico ("Agroindústria"/"Indústria"). Tudo aqui deve
# estar lowercase e SEM ACENTOS — a comparação roda contra a versão
# normalizada do nome (acentos removidos e CamelCase quebrado).
_DOCES_TEMPEROS_WORDS: set[str] = {
    "apiario", "apiarios", "apriario", "apriarios",
    "apicultor", "apicultura", "apis",
    "mel",
    "doce", "doces", "doceria", "docerias",
    "geleia", "geleias",
    "rapadura", "rapaduras",
    "bala", "balas", "pirulito", "pirulitos",
    "cocada", "cocadas", "pacoca", "pacocas", "goiabada", "goiabadas",
    "tempero", "temperos", "condimento", "condimentos",
    "pimenta", "pimentas", "molho", "molhos",
}
_ORIGEM_ANIMAL_WORDS: set[str] = {
    "queijaria", "queijo", "queijos",
    "laticinio", "laticinios", "lacteo", "lacteos",
    "iogurte", "iogurtes",
    "embutido", "embutidos", "defumado", "defumados",
}
_BEBIDAS_WORDS: set[str] = {
    "cervejaria", "cerveja", "cervejas",
    "vinicola", "vinho", "vinhos",
    "cachaca", "cachacas",
    "suco", "sucos",
    "cafe", "cafes",
}


def _strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)
    )


def _name_words(name: str) -> set[str]:
    """Extrai o conjunto de palavras lowercase/sem acento do nome do
    fornecedor. Quebra CamelCase ("CajuMel" → "Caju Mel") e separa por
    qualquer caractere não-alfanumérico.
    """
    no_accents = _strip_accents(name)
    spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", no_accents)
    return {w.lower() for w in re.findall(r"[A-Za-z]+", spaced)}


def _detect_category(
    site_type_label: str | None,
    supplier_type: SupplierType,
    supplier_name: str,
) -> str | None:
    """Mapeia label do site + nome do fornecedor para slug de
    FEITO_POTIGUAR_CATEGORIES.

    Ordem de prioridade:
      1. Restaurantes/hotelaria — slug fixo pelo SupplierType.
      2. Nome do fornecedor — pega keywords específicas (ex.: "Mel Boa Fé",
         "Queijaria JC", "CajuMel", "Apíarios Flora") que diferenciam
         categorias dentro do balaio "Agroindústria"/"Indústria".
      3. Label do site — quando bate categoria do programa Feito Potiguar.
      4. Fallback `alimentos-naturais` (categoria mais ampla).
    """
    if supplier_type == "restaurant":
        return "bares-e-restaurantes"
    if supplier_type == "hospitality":
        return "hospedagem"

    words = _name_words(supplier_name)
    if words & _DOCES_TEMPEROS_WORDS:
        return "doces-e-temperos"
    if words & _ORIGEM_ANIMAL_WORDS:
        return "origem-animal"
    if words & _BEBIDAS_WORDS:
        return "bebidas"

    if site_type_label:
        norm = _strip_accents(site_type_label).lower()
        for key, slug in _CATEGORY_KEYWORDS:
            if key in norm:
                return slug
    return "alimentos-naturais"


@dataclass
class EmpresaScrape:
    supplier: Supplier
    products: list[Product]


def _slice_before_related(md: str) -> str:
    idx = md.find(RELATED_SECTION_MARKER)
    return md if idx < 0 else md[:idx]


def _detect_type(label: str) -> SupplierType:
    norm = label.strip().lower()
    for key, val in TYPE_MAP.items():
        if key in norm:
            return val
    # Fallback: producer (mais comum)
    return "producer"


_CEP_RE = re.compile(r"(\d{2})\.?(\d{3})-?(\d{3})")


def _extract_address(full_address: str) -> dict[str, str | None]:
    """Quebra endereço em campos. Lida com formatos variados:
        "R. Aldo da Fonseca Tinoco - São José, Macaíba - RN, 59280-763"
        "Fazenda Trincheiras, Zona rural de Nova Cruz, 59.215-000 - RN"
        "Fazenda Veneza - Assú"
    """
    out: dict[str, str | None] = {
        "street": None,
        "number": None,
        "district": None,
        "city": None,
        "state": "RN",
        "zip_code": None,
    }

    # CEP em qualquer posição, com ou sem ponto/hífen
    cep_match = _CEP_RE.search(full_address)
    if cep_match:
        out["zip_code"] = cep_match.group(1) + cep_match.group(2) + cep_match.group(3)
        full_address = (
            full_address[: cep_match.start()] + full_address[cep_match.end():]
        ).strip(" ,-")

    # Tira " - RN" / ", RN" / " RN" do final
    full_address = re.sub(r"[,\-\s]+RN\s*[,\-\s]*$", "", full_address).strip(" ,-")

    # Tenta achar uma cidade conhecida do RN no que sobrou (mais confiável que
    # heurística posicional)
    from ..normalize import extract_rn_city
    city = extract_rn_city(full_address + " - RN")  # injeta sufixo pra triggerar regex
    if city:
        out["city"] = city
        # Remove a cidade do endereço pra não duplicar
        full_address = re.sub(
            rf"[,\s\-]*{re.escape(city)}\b", "", full_address, flags=re.IGNORECASE
        ).strip(" ,-")

    # Bairro: parte após o último " - " no que sobrou
    if " - " in full_address:
        before, district = full_address.rsplit(" - ", 1)
        district = district.strip(" ,-")
        if district and not _CEP_RE.search(district):
            out["district"] = district
            full_address = before.strip(" ,-")

    # Número: dígitos no final, opcionalmente precedidos de "Nº" / "N°" / "n.".
    # Os caracteres º (U+00BA) e ° (U+00B0) costumam aparecer indistintamente.
    if full_address:
        num_match = re.search(
            r",?\s*(?:n[º°ºo]\.?\s*)?(\d+[A-Za-z]?)\s*$",
            full_address,
            re.IGNORECASE,
        )
        if num_match:
            out["number"] = num_match.group(1)
            full_address = full_address[: num_match.start()].rstrip(" ,-")
        # Limpa "Nº" residual no fim caso só sobre o prefixo (ex.: rua sem número
        # mas com "Nº" colado).
        full_address = re.sub(
            r"[,\s]*n[º°ºo]\.?\s*$", "", full_address, flags=re.IGNORECASE
        ).rstrip(" ,-")
        out["street"] = full_address or None

    return out


def parse_empresa_page(client: BrowserActClient, url: str) -> EmpresaScrape | None:
    md = client.get_markdown(url)
    if not md:
        return None
    own_md = _slice_before_related(md)
    slug = url.rstrip("/").rsplit("/", 1)[-1]

    name_match = re.search(r"^# (.+?)$", own_md, re.MULTILINE)
    name = clean_text(name_match.group(1)) if name_match else None
    if not name:
        return None

    # Bullets simples (não markdown link, não com colchete)
    bullets: list[str] = []
    for m in re.finditer(r"^\* ([^\[\n]+)$", own_md, re.MULTILINE):
        b = clean_text(m.group(1))
        if b:
            bullets.append(b)

    # 1ª bullet razoável = tipo; 2ª = endereço completo; 3ª = cidade isolada
    site_type_label: str | None = None
    full_address: str | None = None
    city_bullet: str | None = None

    for b in bullets:
        is_phone = bool(re.match(r"^[\(\d\s\-]+\d{4,}$", b))
        if is_phone or b.lower() in {"pendente", "whatsapp", "instagram"}:
            continue
        if site_type_label is None and len(b) < 60 and not _CEP_RE.search(b):
            site_type_label = b
            continue
        if full_address is None and (len(b) > 15 or _CEP_RE.search(b) or " - " in b or "," in b):
            full_address = b
            continue
        if city_bullet is None and 2 < len(b) < 40 and not _CEP_RE.search(b):
            city_bullet = b

    if not site_type_label:
        site_type_label = "Agroindústria"  # fallback

    supplier_type = _detect_type(site_type_label)

    # Endereço estruturado
    address_parts: dict[str, str | None] = {
        "street": None, "number": None, "district": None,
        "city": None, "state": "RN", "zip_code": None,
    }
    if full_address:
        address_parts = _extract_address(full_address)
    # Cidade: prioriza extract_rn_city, depois 3ª bullet, depois inferência do endereço
    city = address_parts["city"]
    if not city and city_bullet:
        # garante que é cidade RN conhecida ou pelo menos não tem dígitos/CEP
        if not _CEP_RE.search(city_bullet) and not re.search(r"\d", city_bullet):
            city = city_bullet
    if not city:
        city = extract_rn_city(own_md)

    # Descrição: primeiro parágrafo significativo (texto corrido, não item de
    # menu/breadcrumb). Ignora linhas que são essencialmente um bullet ou um
    # markdown link (ex.: "+ [Alimentos e Bebidas](...)").
    description: str | None = None
    link_only_re = re.compile(r"^[\+\-\*\s>]*\[[^\]]+\]\([^)]+\)\s*$")
    for line in own_md.split("\n"):
        line = line.strip()
        if not line or line.startswith(("#", "*", "[", "-", "|", "+", ">")):
            continue
        if link_only_re.match(line):
            continue
        cleaned = clean_text(line)
        if cleaned and len(cleaned) > 60:
            description = cleaned[:600]
            break

    # Contatos
    phone: str | None = None
    whatsapp: str | None = None
    instagram: str | None = None

    tel_match = re.search(r"\(tel:[^)]+\)", own_md)
    if tel_match:
        phone = extract_phone(tel_match.group(0))
    wa_match = re.search(r"\(https://wa\.me/(\d+)", own_md)
    if wa_match:
        whatsapp = extract_phone(wa_match.group(1))
    ig_match = re.search(r"\(https://www\.instagram\.com/([A-Za-z0-9_.]+)", own_md)
    if ig_match:
        instagram = ig_match.group(1)
    email = extract_email(own_md)

    supplier = Supplier(
        slug=slug,
        name=name,
        type=supplier_type,
        description=description,
        story=description,
        logo_url=None,
        cover_url=None,
        primary_category=_detect_category(site_type_label, supplier_type, name),
        street=address_parts["street"],
        number=address_parts["number"],
        district=address_parts["district"],
        city=city,
        state="RN",
        zip_code=address_parts["zip_code"],
        full_address=full_address,
        phone=phone,
        whatsapp=whatsapp,
        email=email,
        instagram=instagram,
        site_type_label=site_type_label,
        source_url=url,
        raw_categories=[],
    )

    products = _extract_products(own_md, supplier_slug=slug, supplier_name=name)
    return EmpresaScrape(supplier=supplier, products=products)


def _extract_products(md: str, supplier_slug: str, supplier_name: str) -> list[Product]:
    products: list[Product] = []
    seen: set[str] = set()

    for h in re.finditer(r"^## (.+?)$", md, re.MULTILINE):
        raw = clean_text(h.group(1))
        if not raw or PRODUCT_TITLE_SEPARATOR not in raw:
            continue
        parts = raw.rsplit(PRODUCT_TITLE_SEPARATOR, 1)
        if len(parts) != 2:
            continue
        product_name = clean_text(parts[0])
        empresa_in_title = clean_text(parts[1])
        if not product_name or not empresa_in_title:
            continue
        if empresa_in_title.lower() != supplier_name.lower():
            continue

        product_url = ""
        section = md[h.end() : h.end() + 800]
        url_match = PRODUTO_LINK_RE.search(section)
        if url_match:
            product_url = f"https://feitopotiguar.com.br/post-produtos/{url_match.group(1)}/"

        product_slug = slugify(f"{supplier_slug}-{product_name}")
        if product_slug in seen:
            continue
        seen.add(product_slug)

        products.append(
            Product(
                slug=product_slug,
                name=product_name,
                supplier_slug=supplier_slug,
                source_url=product_url,
            )
        )

    return products
