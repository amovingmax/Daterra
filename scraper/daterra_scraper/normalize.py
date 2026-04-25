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
    if not text:
        return None
    digits = re.sub(r"\D", "", text)
    if len(digits) >= 10:
        return digits[-11:] if len(digits) >= 11 else digits
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
