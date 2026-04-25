-- =========================================================
-- Da Terra — schema inicial (MVP)
-- Conforme PRD v1.0, seções 6 a 10.
-- =========================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "postgis" with schema extensions;

-- ---------------------------------------------------------
-- Enums
-- ---------------------------------------------------------

create type order_status as enum (
  'pending_payment',
  'received',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

create type payment_method as enum ('pix', 'credit_card');

create type payment_status as enum ('pending', 'authorized', 'paid', 'refunded', 'failed');

create type supplier_type as enum ('producer', 'restaurant', 'hospitality');

create type delivery_provider as enum ('uber_direct', 'loggi', 'pickup', 'own');

create type payout_status as enum ('scheduled', 'processing', 'paid', 'failed');

create type cancel_reason as enum (
  'changed_mind',
  'wrong_item',
  'too_long',
  'price_issue',
  'address_issue',
  'supplier_unavailable',
  'out_of_stock',
  'other'
);

create type supplier_role as enum ('owner', 'manager', 'staff');

-- ---------------------------------------------------------
-- profiles  (extende auth.users)
-- ---------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text not null,
  cpf text unique,
  avatar_url text,
  notification_prefs jsonb not null default jsonb_build_object(
    'order_updates', true,
    'promotions', true,
    'favorites_news', true,
    'newsletter', false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_phone_idx on public.profiles (phone);

-- ---------------------------------------------------------
-- addresses
-- ---------------------------------------------------------

create table public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(label) <= 40),
  zip_code text not null check (zip_code ~ '^\d{8}$'),
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state text not null check (state = 'RN'),
  reference text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_primary_per_user_idx
  on public.addresses (user_id) where is_primary;

-- ---------------------------------------------------------
-- categories  (Feito Potiguar)
-- ---------------------------------------------------------

create table public.categories (
  slug text primary key,
  label text not null,
  icon text,
  parent_slug text references public.categories(slug),
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ---------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------

create table public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  type supplier_type not null,
  cnpj text not null unique check (cnpj ~ '^\d{14}$'),
  description text,
  story text,
  logo_url text,
  cover_url text,
  primary_category text references public.categories(slug),

  -- localização
  zip_code text,
  street text,
  number text,
  complement text,
  district text,
  city text not null,
  state text not null default 'RN',
  latitude numeric(10, 7),
  longitude numeric(10, 7),

  -- contato
  whatsapp text,
  instagram text,
  email text,

  -- selo
  feito_potiguar_certified_at date not null,
  feito_potiguar_valid_until date,

  -- operação
  min_order_cents int not null default 0,
  avg_prep_minutes int not null default 30,
  delivery_radius_km int,
  accepts_pickup boolean not null default true,
  pix_key text,

  is_active boolean not null default false,
  source text,                    -- 'feito_potiguar_scrape', 'manual', etc.
  source_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index suppliers_city_idx on public.suppliers (city);
create index suppliers_category_idx on public.suppliers (primary_category);
create index suppliers_active_idx on public.suppliers (is_active) where is_active;
create index suppliers_name_trgm_idx on public.suppliers using gin (name gin_trgm_ops);

-- ---------------------------------------------------------
-- supplier_users  (quem pode gerenciar uma loja)
-- ---------------------------------------------------------

create table public.supplier_users (
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role supplier_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (supplier_id, user_id)
);

create index supplier_users_user_idx on public.supplier_users (user_id);

-- ---------------------------------------------------------
-- supplier_business_hours
-- ---------------------------------------------------------

create table public.supplier_business_hours (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0=domingo
  opens_at time not null,
  closes_at time not null,
  check (opens_at < closes_at)
);

create index supplier_hours_idx on public.supplier_business_hours (supplier_id, weekday);

-- pausa rápida ("fechado por hoje" — toggle do painel)
alter table public.suppliers add column manually_closed_until timestamptz;

-- ---------------------------------------------------------
-- products
-- ---------------------------------------------------------

create table public.products (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  category text references public.categories(slug),
  subcategory text,

  price_cents int not null check (price_cents > 0),
  promo_price_cents int check (promo_price_cents > 0 and promo_price_cents < price_cents),
  promo_starts_at timestamptz,
  promo_ends_at timestamptz,

  stock int,
  weight_grams int,
  shelf_life_days int,
  ingredients text,
  sku text,

  photos text[] not null default '{}',
  variations jsonb,    -- [{id, label, price_cents}]
  addons jsonb,        -- [{id, label, price_cents}]

  store_section text,  -- "Mais pedidos", "Queijos", etc.
  sort_order int not null default 0,

  is_active boolean not null default true,
  source text,
  source_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (supplier_id, slug)
);

create index products_supplier_idx on public.products (supplier_id);
create index products_category_idx on public.products (category);
create index products_active_idx on public.products (is_active) where is_active;
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);

-- ---------------------------------------------------------
-- favorites
-- ---------------------------------------------------------

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((supplier_id is not null) <> (product_id is not null)),
  unique (user_id, supplier_id, product_id)
);

create index favorites_user_idx on public.favorites (user_id);

-- ---------------------------------------------------------
-- coupons
-- ---------------------------------------------------------

create table public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  discount_kind text not null check (discount_kind in ('percent', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_order_cents int,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  usage_limit int,
  uses_count int not null default 0,
  supplier_id uuid references public.suppliers(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------
-- orders
-- ---------------------------------------------------------

create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  number text not null unique,
  user_id uuid not null references public.profiles(id),
  supplier_id uuid not null references public.suppliers(id),

  status order_status not null default 'pending_payment',

  subtotal_cents int not null check (subtotal_cents >= 0),
  delivery_cents int not null default 0 check (delivery_cents >= 0),
  discount_cents int not null default 0 check (discount_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  commission_cents int not null check (commission_cents >= 0),

  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  payment_id text,

  delivery_address jsonb,        -- snapshot do endereço
  delivery_provider delivery_provider,
  delivery_tracking_url text,
  delivery_eta_minutes int,

  coupon_code text,
  coupon_id uuid references public.coupons(id),

  cancellation_reason cancel_reason,
  cancellation_detail text,
  cancelled_by text check (cancelled_by in ('customer', 'supplier', 'system')),

  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  ready_at timestamptz,
  out_for_delivery_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_supplier_idx on public.orders (supplier_id, created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_number_idx on public.orders (number);

-- ---------------------------------------------------------
-- order_items
-- ---------------------------------------------------------

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  name_snapshot text not null,
  unit_price_cents int not null check (unit_price_cents > 0),
  quantity int not null check (quantity > 0),
  variation_label text,
  addons jsonb not null default '[]', -- [{label, price_cents}]
  note text
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------
-- order_status_history
-- ---------------------------------------------------------

create table public.order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status order_status not null,
  changed_by uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create index order_status_history_idx on public.order_status_history (order_id, created_at);

-- ---------------------------------------------------------
-- reviews
-- ---------------------------------------------------------

create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  rating_store smallint not null check (rating_store between 1 and 5),
  rating_delivery smallint check (rating_delivery between 1 and 5),
  comment text,
  tags text[] not null default '{}',
  photos text[] not null default '{}',
  supplier_reply text,
  supplier_replied_at timestamptz,
  created_at timestamptz not null default now()
);

create index reviews_supplier_idx on public.reviews (supplier_id, created_at desc);
create index reviews_product_idx on public.reviews (product_id);

-- ---------------------------------------------------------
-- payouts  (repasses Pix ao fornecedor — D+7)
-- ---------------------------------------------------------

create table public.payouts (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  status payout_status not null default 'scheduled',
  scheduled_for date not null,
  paid_at timestamptz,
  pix_key text not null,
  failure_reason text,
  created_at timestamptz not null default now()
);

create table public.payout_orders (
  payout_id uuid not null references public.payouts(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  net_amount_cents int not null,
  primary key (payout_id, order_id)
);

create index payouts_supplier_idx on public.payouts (supplier_id, scheduled_for desc);
create index payouts_status_idx on public.payouts (status);

-- ---------------------------------------------------------
-- payment_cards  (tokenizados via Mercado Pago)
-- ---------------------------------------------------------

create table public.payment_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  brand text not null,
  last4 text not null check (last4 ~ '^\d{4}$'),
  holder_name text not null,
  exp_month smallint not null check (exp_month between 1 and 12),
  exp_year smallint not null,
  mp_card_id text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index payment_cards_user_idx on public.payment_cards (user_id);

-- ---------------------------------------------------------
-- notifications
-- ---------------------------------------------------------

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------
-- expo_push_tokens
-- ---------------------------------------------------------

create table public.expo_push_tokens (
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null primary key,
  device text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index expo_tokens_user_idx on public.expo_push_tokens (user_id);

-- ---------------------------------------------------------
-- waitlist  (cidades sem cobertura)
-- ---------------------------------------------------------

create table public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  city text not null,
  state text not null,
  source text,
  created_at timestamptz not null default now()
);

create index waitlist_city_idx on public.waitlist (state, city);

-- ---------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger suppliers_touch_updated_at before update on public.suppliers
  for each row execute function public.touch_updated_at();

create trigger products_touch_updated_at before update on public.products
  for each row execute function public.touch_updated_at();
