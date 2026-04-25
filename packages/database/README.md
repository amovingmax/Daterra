# @daterra/database

Schema PostgreSQL do Da Terra, gerenciado via Supabase CLI. Inclui migrations versionadas, Row Level Security policies, funções de domínio (cálculo de comissão, geração de número de pedido) e seed inicial das categorias do Feito Potiguar.

## Estrutura

```
packages/database/
├── supabase/
│   ├── config.toml                # configuração local do Supabase
│   └── migrations/
│       ├── 20260424000001_init_schema.sql       # tabelas + índices + triggers
│       ├── 20260424000002_functions.sql         # funções de domínio + RLS helpers
│       ├── 20260424000003_rls.sql               # políticas RLS
│       ├── 20260424000004_seed_categories.sql   # categorias Feito Potiguar
│       └── 20260424000005_storage.sql           # buckets + políticas de Storage
└── src/
    ├── index.ts                   # createClient(...) com tipagem
    └── types.ts                   # gerado pelo Supabase CLI
```

## Pré-requisitos

Instalar Supabase CLI (uma vez por máquina):

```bash
brew install supabase/tap/supabase
# ou
pnpm dlx supabase --version
```

## Conectar ao projeto remoto Supabase

```bash
cd packages/database
supabase login
supabase link --project-ref <SEU_PROJECT_REF>
```

`<SEU_PROJECT_REF>` é o `xxxxxxxxxx` em `https://xxxxxxxxxx.supabase.co`.

## Aplicar migrations

```bash
# remoto (Supabase cloud)
pnpm --filter @daterra/database db:push

# local (Docker)
pnpm --filter @daterra/database db:start
pnpm --filter @daterra/database db:reset
```

## Regerar tipos TypeScript após mudanças no schema

```bash
pnpm --filter @daterra/database db:gen-types:remote   # contra o cloud
pnpm --filter @daterra/database db:gen-types          # contra o local
```

## Tabelas principais

- `profiles` — extende `auth.users`, com nome, telefone, CPF, prefs de notificação
- `addresses` — endereços do cliente, com índice único de "principal" por usuário
- `categories` — categorias do Feito Potiguar (hierárquicas)
- `suppliers` — fornecedores certificados (produtores, restaurantes, hotelaria)
- `supplier_users` — quem pode gerenciar cada loja (roles: owner, manager, staff)
- `supplier_business_hours` — horário de funcionamento por dia da semana
- `products` — catálogo, com variações e complementos em JSONB
- `orders` + `order_items` + `order_status_history` — pedidos com timeline
- `reviews` — avaliações com resposta do fornecedor
- `payouts` + `payout_orders` — repasses Pix D+7 ao fornecedor
- `coupons` — cupons da plataforma ou do próprio fornecedor
- `payment_cards` — cartões tokenizados via Mercado Pago
- `notifications` + `expo_push_tokens` — push notifications
- `favorites` — favoritos (loja ou produto)
- `waitlist` — interesse de cidades sem cobertura

## Regras de negócio embutidas

- **Comissão 15%** calculada automaticamente no `before_insert_order` (PRD §10.1)
- **Número de pedido** gerado como `DT-YYYY-000123` via sequence
- **Timeline do pedido** (`accepted_at`, `delivered_at` etc.) preenchido por trigger
- **Histórico de status** logado em `order_status_history` por trigger
- **Profile auto-criado** no signup via trigger em `auth.users`
- **Endereço apenas no RN** — constraint `state = 'RN'` (PRD §8.8)
- **RLS habilitada** em todas as tabelas, com políticas isolando cliente / fornecedor / admin

## Fluxo recomendado

1. Crie o projeto no Supabase
2. `supabase link --project-ref <ref>` aqui dentro
3. `pnpm --filter @daterra/database db:push` para aplicar todas as migrations
4. `pnpm --filter @daterra/database db:gen-types:remote` para gerar `src/types.ts`
5. Importe `createBrowserClient` ou `createServiceClient` nos apps
