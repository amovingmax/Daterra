"""Parsers por seção do site Feito Potiguar."""

from .hospitality import scrape_hospitality
from .producers import scrape_producers
from .restaurants import scrape_restaurants

__all__ = [
    "scrape_producers",
    "scrape_restaurants",
    "scrape_hospitality",
]
