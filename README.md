# Da Terra 🌱

Marketplace mobile-first que conecta consumidores do Rio Grande do Norte aos produtores, agroindústrias, bares, restaurantes e hotéis certificados com o **Selo Feito Potiguar**.

## Estrutura

```
da-terra/
├── apps/
│   ├── mobile/          # Expo (cliente)
│   ├── web/             # Next.js (painel fornecedor + landing)
│   └── admin/           # Next.js (admin interno)
├── packages/
│   ├── database/        # schemas Supabase + migrations
│   ├── shared/          # tipos TS, validações Zod, utils
│   └── ui/              # componentes React compartilhados
├── scraper/             # Python — extração inicial do feitopotiguar.com.br
└── docs/
    └── PRD.md
```

## Pré-requisitos

- Node.js >= 20 (testado com 25.9)
- pnpm >= 9
- Python 3.9+ (para o scraper)
- Conta Supabase (free tier serve)

## Setup

```bash
pnpm install
```

Variáveis de ambiente — copie `.env.example` em cada app e preencha com suas chaves Supabase.

## Comandos

```bash
pnpm dev          # roda todos os apps em dev
pnpm build        # build de produção
pnpm lint         # ESLint em todos os pacotes
pnpm typecheck    # verifica tipos
pnpm test         # roda testes
pnpm format       # Prettier write
```

## Stack

| Camada | Tecnologia |
|--------|------------|
| Mobile | React Native + Expo |
| Web | Next.js 15 (App Router) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Pagamentos | Mercado Pago |
| Logística | Uber Direct (Natal/RM) + Loggi (interior) |
| Notificações | Expo Notifications |
| Mapas | Google Maps SDK |
| Analytics | PostHog |
| Erros | Sentry |

Ver detalhes em [`docs/PRD.md`](docs/PRD.md).
