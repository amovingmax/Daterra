"""Dataclasses representando o domínio raspado."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Literal, Optional


SupplierType = Literal["producer", "restaurant", "hospitality"]


@dataclass
class Supplier:
    slug: str
    name: str
    type: SupplierType
    description: Optional[str] = None
    story: Optional[str] = None
    logo_url: Optional[str] = None
    cover_url: Optional[str] = None
    primary_category: Optional[str] = None

    # Endereço estruturado
    street: Optional[str] = None
    number: Optional[str] = None
    complement: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    state: str = "RN"
    zip_code: Optional[str] = None
    full_address: Optional[str] = None  # raw da bullet do site

    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    instagram: Optional[str] = None
    website: Optional[str] = None
    cnpj: Optional[str] = None
    feito_potiguar_certified_at: Optional[str] = None
    site_type_label: Optional[str] = None  # "Agroindústria", "Hotel", etc.
    source_url: str = ""
    raw_categories: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Product:
    slug: str
    name: str
    supplier_slug: str
    description: Optional[str] = None
    photo_url: Optional[str] = None
    photos: list[str] = field(default_factory=list)
    differentials: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    source_url: str = ""

    def to_dict(self) -> dict:
        return asdict(self)
