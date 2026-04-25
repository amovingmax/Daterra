"""Funções utilitárias de normalização de strings."""

from __future__ import annotations

import re
from typing import Optional

from slugify import slugify as _slugify


def slugify(text: str) -> str:
    return _slugify(text, lowercase=True, separator="-")


def clean_text(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def extract_phone(text: Optional[str]) -> Optional[str]:
    """Extrai telefone BR como string só-dígitos (10 ou 11), sem código do país."""
    if not text:
        return None
    digits = re.sub(r"\D", "", text)
    if len(digits) < 10:
        return None
    # Strip código do país BR (+55) quando presente
    if len(digits) in (12, 13) and digits.startswith("55"):
        digits = digits[2:]
    if 10 <= len(digits) <= 11:
        return digits
    return None


def extract_email(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    return match.group(0).lower() if match else None


def extract_instagram(href: Optional[str]) -> Optional[str]:
    if not href:
        return None
    match = re.search(r"instagram\.com/([A-Za-z0-9_.]+)", href)
    return match.group(1) if match else None


def normalize_city(city: Optional[str]) -> Optional[str]:
    if not city:
        return None
    return clean_text(city.title())


# Cidades RN com nome composto que precisam ser detectadas antes do fallback
# (caso contrário o regex pega só a última palavra).
_MULTIWORD_RN_CITIES = (
    "São Gonçalo do Amarante",
    "Tibau do Sul",
    "São José de Mipibu",
    "São José do Seridó",
    "São Miguel do Gostoso",
    "São Miguel",
    "Currais Novos",
    "São Vicente",
    "Ceará-Mirim",
    "Pau dos Ferros",
    "João Câmara",
    "Nísia Floresta",
    "Santa Cruz",
    "Pedro Velho",
    "Lagoa Nova",
    "Areia Branca",
    "Areia de Baraúnas",
    "Lajes Pintadas",
    "Cerro Corá",
    "Tenente Laurentino Cruz",
    "Jardim do Seridó",
    "Santana do Seridó",
    "Santana do Matos",
    "Riacho da Cruz",
    "Almino Afonso",
    "Marcelino Vieira",
    "Tenente Ananias",
    "Luís Gomes",
)

_FILLER_WORDS = {
    "município",
    "munícipio",
    "rn",
    "estado",
    "região",
    "cidade",
    "praia",
    "natureza",
    "exuberante",
    "pioneira",
    "fresco",
    "fresca",
}


def extract_rn_city(text: Optional[str]) -> Optional[str]:
    """Extrai a cidade do RN a partir de texto livre.

    Estratégia: procura por nomes compostos conhecidos primeiro; depois
    cai num pattern '<palavra> - RN' que captura só a última palavra,
    filtrando palavras de enchimento.
    """
    if not text:
        return None

    # 1. Cidades de nome composto (case insensitive)
    for city in _MULTIWORD_RN_CITIES:
        if re.search(rf"\b{re.escape(city)}\b", text, re.IGNORECASE):
            return city

    # 2. Última palavra capitalizada antes de "- RN" (ou variantes)
    matches = re.finditer(
        r"\b([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ']{2,30})\s*[\-/–]\s*RN\b",
        text,
    )
    for m in matches:
        candidate = clean_text(m.group(1))
        if not candidate:
            continue
        if candidate.lower() in _FILLER_WORDS:
            continue
        return candidate

    return None
