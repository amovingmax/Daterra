# Da Terra · Scraper

Extrator do site oficial do programa **Feito Potiguar** (`https://feitopotiguar.com.br`). Gera arquivos JSON estruturados que servem de seed inicial para o banco Supabase do Da Terra.

Conforme PRD §12.1, raspamos:

- `/produtores/` — empresas tipo *producer* (alimentos, bebidas, conservas)
- `/bares-e-restaurantes/` — empresas tipo *restaurant*
- `/hotelaria/` — empresas tipo *hospitality*

Cada empresa fica em `/empresa/<slug>/`. Os **produtos** são extraídos da própria página da empresa (H2s no formato `"<nome do produto> – <empresa>"`).

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
```

Saída em `output/`:

```
output/
├── suppliers.json     # consolidado (producers + restaurants + hospitality, dedup por slug)
├── products.json      # consolidado de produtos (dedup por slug)
├── producers.json
├── restaurants.json
└── hospitality.json
```

Cache HTML em `cache/` (evita rebaixar páginas já visitadas). Apague pra forçar refresh.

## Importar no Supabase

Após gerar os JSONs:

```bash
SUPABASE_URL="https://<project-ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>" \
.venv/bin/python -m daterra_scraper.import_to_supabase
```

> ⚠️ Use a `service_role` key — políticas RLS bloqueiam upsert anônimo.

Os fornecedores entram com `is_active=false` e CNPJ nulo. O admin Da Terra preenche o CNPJ, valida o cadastro e ativa cada um manualmente antes de aparecerem no app cliente.

Adiciona `--activate` se quiser ativar tudo imediatamente (para ambientes de teste):

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  .venv/bin/python -m daterra_scraper.import_to_supabase --activate
```

(Constraint do banco impede ativar fornecedor sem CNPJ — atualmente só funciona para suppliers já com CNPJ preenchido.)

## Estrutura

```
scraper/
├── daterra_scraper/
│   ├── __init__.py
│   ├── cli.py
│   ├── http.py             # client HTTP com cache + rate limit
│   ├── parsers/
│   │   ├── __init__.py
│   │   ├── _common.py      # listing → empresa → Supplier + Products
│   │   ├── producers.py
│   │   ├── restaurants.py
│   │   └── hospitality.py
│   ├── models.py           # dataclasses Supplier / Product
│   ├── normalize.py        # extract_phone, extract_rn_city, slugify, etc.
│   └── import_to_supabase.py
├── requirements.txt
└── output/                 # gerado, ignorado pelo git
```

## Boas práticas

- **Respeito ao site:** rate limit de 1 req/seg por padrão (`--delay 1.0`).
- **Cache:** páginas baixadas ficam em `cache/`. Apague pra forçar refresh.
- **Idempotente:** rodar duas vezes não duplica entradas — `slug` é a chave de upsert.
- **Inativo por padrão:** todos os imports vêm com `is_active=false`. O admin ativa manualmente.

## Quando o site mudar

O scraper depende da estrutura HTML do feitopotiguar.com.br (WordPress + Elementor). Sinais de que o parser quebrou:

- Cidades em branco em massa
- Telefones em formato esquisito
- Produtos não extraídos quando a empresa visivelmente tem produtos no site

O ponto principal de manutenção é `parsers/_common.py:parse_empresa_page` e `normalize.extract_rn_city`.
