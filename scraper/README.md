# Da Terra · Scraper

Extrator do site oficial do programa **Feito Potiguar** (`https://feitopotiguar.com.br`). Gera arquivos JSON estruturados que servem de seed inicial para o banco Supabase do Da Terra.

Conforme PRD §12.1, raspamos:

- `/produtores/` — fornecedores tipo *producer* (alimentos, bebidas, conservas etc.)
- `/bares-e-restaurantes/` — fornecedores tipo *restaurant*
- `/hotelaria/` — fornecedores tipo *hospitality*
- `/vitrine/` — produtos com fornecedor associado

## Setup

```bash
cd scraper
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Uso

```bash
# raspa tudo
python -m daterra_scraper.cli all

# só uma seção
python -m daterra_scraper.cli producers
python -m daterra_scraper.cli restaurants
python -m daterra_scraper.cli hospitality
python -m daterra_scraper.cli products
```

Saída em `output/`:

```
output/
├── suppliers.json     # consolidado (producers + restaurants + hospitality)
├── producers.json
├── restaurants.json
├── hospitality.json
└── products.json
```

Cache HTTP em `cache/` (evita rebaixar páginas já visitadas).

## Importar no Supabase

Após gerar os JSONs:

```bash
# do root do monorepo
python -m daterra_scraper.import_to_supabase \
  --supabase-url "$SUPABASE_URL" \
  --supabase-service-key "$SUPABASE_SERVICE_ROLE_KEY"
```

> ⚠️ Use a `service_role` key — políticas RLS bloqueiam inserção como usuário comum.

## Estrutura

```
scraper/
├── daterra_scraper/
│   ├── __init__.py
│   ├── cli.py              # entry point
│   ├── http.py             # client HTTP com cache + rate limit
│   ├── parsers/
│   │   ├── __init__.py
│   │   ├── producers.py
│   │   ├── restaurants.py
│   │   ├── hospitality.py
│   │   └── products.py
│   ├── models.py           # dataclasses
│   ├── normalize.py        # limpeza/normalização de strings
│   └── import_to_supabase.py
├── requirements.txt
└── output/                 # gerado, ignorado pelo git
```

## Boas práticas

- **Respeito ao site:** rate limit de 1 req/seg por padrão (`--delay 1.0`).
- **Cache:** páginas baixadas ficam em `cache/`. Apague pra forçar refresh.
- **Idempotente:** rodar duas vezes não duplica entradas — `slug` é a chave.
