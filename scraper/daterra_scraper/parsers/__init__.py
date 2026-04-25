"""Parsers por seção do site Feito Potiguar."""

from .producers import scrape_producers
from .restaurants import scrape_restaurants
from .hospitality import scrape_hospitality
from .products import scrape_products

__all__ = [
    "scrape_producers",
    "scrape_restaurants",
    "scrape_hospitality",
    "scrape_products",
]
