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
    "São José do Campestre",
    "São Miguel do Gostoso",
    "São Miguel",
    "São Bento do Trairi",
    "São Bento do Norte",
    "São Tomé",
    "São Pedro",
    "São Paulo do Potengi",
    "São Rafael",
    "São Fernando",
    "Currais Novos",
    "São Vicente",
    "Ceará-Mirim",
    "Pau dos Ferros",
    "João Câmara",
    "João Dias",
    "Nísia Floresta",
    "Santa Cruz",
    "Santa Maria",
    "Santa Cecília",
    "Pedro Velho",
    "Pedro Avelino",
    "Lagoa Nova",
    "Lagoa de Velhos",
    "Lagoa de Pedras",
    "Lagoa Salgada",
    "Lagoa d'Anta",
    "Areia Branca",
    "Areia de Baraúnas",
    "Lajes Pintadas",
    "Cerro Corá",
    "Tenente Laurentino Cruz",
    "Tenente Ananias",
    "Jardim do Seridó",
    "Jardim de Angicos",
    "Jardim de Piranhas",
    "Santana do Seridó",
    "Santana do Matos",
    "Riacho da Cruz",
    "Riacho de Santana",
    "Almino Afonso",
    "Marcelino Vieira",
    "Luís Gomes",
    "Nova Cruz",
    "Cruzeta",
    "Major Sales",
    "Bento Fernandes",
    "Pedra Grande",
    "Pedra Preta",
    "Coronel Ezequiel",
    "Coronel João Pessoa",
    "Coronel Martins",
    "Vila Flor",
    "Várzea",
    "Espírito Santo",
    "Encanto",
    "Doutor Severiano",
    "Florânia",
    "Frutuoso Gomes",
    "Governador Dix-Sept Rosado",
    "Ielmo Marinho",
    "Ipanguaçu",
    "Ipueira",
    "Itajá",
    "Itaú",
    "Jaçanã",
    "Janduís",
    "Japi",
    "Jardim",
    "Jucurutu",
    "Jundiá",
    "Lajes",
    "Macau",
    "Maxaranguape",
    "Messias Targino",
    "Monte Alegre",
    "Monte das Gameleiras",
    "Mossoró",
    "Olho-d'Água do Borges",
    "Ouro Branco",
    "Paraná",
    "Paraú",
    "Parazinho",
    "Parelhas",
    "Parnamirim",
    "Passa e Fica",
    "Passagem",
    "Patu",
    "Paulista",
    "Pendências",
    "Piloto",
    "Pilões",
    "Poço Branco",
    "Portalegre",
    "Porto do Mangue",
    "Pureza",
    "Rafael Fernandes",
    "Rafael Godeiro",
    "Riachuelo",
    "Rio do Fogo",
    "Rodolfo Fernandes",
    "Ruy Barbosa",
    "Senador Eloi de Souza",
    "Senador Georgino Avelino",
    "Serra Caiada",
    "Serra de São Bento",
    "Serra do Mel",
    "Serra Negra do Norte",
    "Serrinha",
    "Serrinha dos Pintos",
    "Severiano Melo",
    "Sítio Novo",
    "Tabuleiro Grande",
    "Taipu",
    "Tangará",
    "Tenente Laurentino",
    "Timbaúba dos Batistas",
    "Touros",
    "Triunfo Potiguar",
    "Umarizal",
    "Upanema",
    "Várzea",
    "Venha-Ver",
    "Viçosa",
    "Vila Flor",
)

# Cidades de palavra única que precisam ser explicitamente reconhecidas
_SINGLE_WORD_RN_CITIES = (
    "Natal",
    "Mossoró",
    "Parnamirim",
    "Macaíba",
    "Caicó",
    "Açu",
    "Apodi",
    "Ipueira",
    "Macau",
    "Touros",
    "Bodó",
    "Galinhos",
    "Mirim",
    "Martins",
    "Areia",
    "Carnaubais",
    "Cruzeta",
    "Acari",
    "Florânia",
    "Patu",
    "Tangará",
    "Triunfo",
    "Lajes",
)

_FILLER_WORDS = {
    "município",
    "munícipio",
    "rn",
    "estado",
    "norte",
    "sul",
    "leste",
    "oeste",
    "centro",
    "cidade",
    "rural",
    "urbano",
    "redondo",
    "alto",
    "baixo",
    "novo",
    "nova",
    "velho",
    "velha",
    "região",
    "região",
    "cidade",
    "praia",
    "natureza",
    "exuberante",
    "pioneira",
    "fresco",
    "fresca",
}


_SINGLE_WORD_LOWER = {c.lower() for c in _SINGLE_WORD_RN_CITIES}


def extract_rn_city(text: Optional[str]) -> Optional[str]:
    """Extrai a cidade do RN a partir de texto livre.

    Estratégia em camadas:
      1. Cidades compostas conhecidas (whitelist)
      2. Cidades single-word conhecidas (whitelist)
      3. Fallback: regex `<palavra> - RN` filtrando fillers — mas só aceita
         se a palavra for cidade conhecida ou tiver acento (heurística fraca).
    """
    if not text:
        return None

    # 1. Cidades compostas
    for city in _MULTIWORD_RN_CITIES:
        if re.search(rf"\b{re.escape(city)}\b", text, re.IGNORECASE):
            return city

    # 2. Cidades single-word conhecidas
    for city in _SINGLE_WORD_RN_CITIES:
        if re.search(rf"\b{re.escape(city)}\b", text, re.IGNORECASE):
            return city

    # 3. Última palavra antes de "- RN" — só aceita se conhecida ou tiver acento
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
        if candidate.lower() in _SINGLE_WORD_LOWER:
            return candidate
        # heurística fraca: aceita se tem acento (ex: "Pendências")
        if re.search(r"[À-ÿ]", candidate):
            return candidate
        # caso contrário, descarta (palavra genérica)

    return None
