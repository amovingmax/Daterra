-- =========================================================
-- Row Level Security (RLS)
-- =========================================================

alter table public.profiles               enable row level security;
alter table public.addresses              enable row level security;
alter table public.categories             enable row level security;
alter table public.suppliers              enable row level security;
alter table public.supplier_users         enable row level security;
alter table public.supplier_business_hours enable row level security;
alter table public.products               enable row level security;
alter table public.favorites              enable row level security;
alter table public.coupons                enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.order_status_history   enable row level security;
alter table public.reviews                enable row level security;
alter table public.payouts                enable row level security;
alter table public.payout_orders          enable row level security;
alter table public.payment_cards          enable row level security;
alter table public.notifications          enable row level security;
alter table public.expo_push_tokens       enable row level security;
alter table public.waitlist               enable row level security;

-- ---------------------------------------------------------
-- profiles: dono lê/atualiza; cadastro pelo trigger
-- ---------------------------------------------------------
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_platform_admin());

create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------
-- addresses: dono CRUD
-- ---------------------------------------------------------
create policy "addresses_owner_all" on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------
-- categories: leitura pública
-- ---------------------------------------------------------
create policy "categories_public_read" on public.categories
  for select using (is_active);

create policy "categories_admin_write" on public.categories
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------------------------------------------------------
-- suppliers: público lê ativos; membros gerenciam; admin tudo
-- ---------------------------------------------------------
create policy "suppliers_public_read_active" on public.suppliers
  for select using (is_active or public.is_supplier_member(id) or public.is_platform_admin());

create policy "suppliers_member_update" on public.suppliers
  for update using (public.is_supplier_member(id))
  with check (public.is_supplier_member(id));

create policy "suppliers_admin_all" on public.suppliers
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------------------------------------------------------
-- supplier_users: membros leem; admin gerencia
-- ---------------------------------------------------------
create policy "supplier_users_self_read" on public.supplier_users
  for select using (user_id = auth.uid() or public.is_supplier_member(supplier_id) or public.is_platform_admin());

create policy "supplier_users_admin_write" on public.supplier_users
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------------------------------------------------------
-- supplier_business_hours
-- ---------------------------------------------------------
create policy "hours_public_read" on public.supplier_business_hours
  for select using (true);

create policy "hours_member_write" on public.supplier_business_hours
  for all using (public.is_supplier_member(supplier_id))
  with check (public.is_supplier_member(supplier_id));

-- ---------------------------------------------------------
-- products: público lê ativos; membros gerenciam; admin tudo
-- ---------------------------------------------------------
create policy "products_public_read_active" on public.products
  for select using (is_active or public.is_supplier_member(supplier_id) or public.is_platform_admin());

create policy "products_member_write" on public.products
  for all using (public.is_supplier_member(supplier_id))
  with check (public.is_supplier_member(supplier_id));

create policy "products_admin_all" on public.products
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------------------------------------------------------
-- favorites: dono CRUD
-- ---------------------------------------------------------
create policy "favorites_owner_all" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------
-- coupons: leitura pública (validação por código no checkout); admin/membro escreve
-- ---------------------------------------------------------
create policy "coupons_public_read_active" on public.coupons
  for select using (now() between starts_at and ends_at);

create policy "coupons_member_write" on public.coupons
  for all using (
    (supplier_id is not null and public.is_supplier_member(supplier_id))
    or public.is_platform_admin()
  ) with check (
    (supplier_id is not null and public.is_supplier_member(supplier_id))
    or public.is_platform_admin()
  );

-- ---------------------------------------------------------
-- orders: cliente vê os seus; fornecedor vê dele; admin tudo
-- ---------------------------------------------------------
create policy "orders_customer_read" on public.orders
  for select using (user_id = auth.uid());

create policy "orders_customer_insert" on public.orders
  for insert with check (user_id = auth.uid());

create policy "orders_customer_cancel" on public.orders
  for update using (
    user_id = auth.uid()
    and status in ('pending_payment', 'received', 'accepted')
  ) with check (user_id = auth.uid());

create policy "orders_supplier_read" on public.orders
  for select using (public.is_supplier_member(supplier_id));

create policy "orders_supplier_update" on public.orders
  for update using (public.is_supplier_member(supplier_id))
  with check (public.is_supplier_member(supplier_id));

create policy "orders_admin_all" on public.orders
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------------------------------------------------------
-- order_items: derivam de orders
-- ---------------------------------------------------------
create policy "order_items_read" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_supplier_member(o.supplier_id) or public.is_platform_admin())
    )
  );

create policy "order_items_customer_insert" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------
-- order_status_history: leitura igual a orders; insert via trigger
-- ---------------------------------------------------------
create policy "order_status_history_read" on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (o.user_id = auth.uid() or public.is_supplier_member(o.supplier_id) or public.is_platform_admin())
    )
  );

-- ---------------------------------------------------------
-- reviews: leitura pública; cliente escreve a sua; fornecedor responde
-- ---------------------------------------------------------
create policy "reviews_public_read" on public.reviews
  for select using (true);

create policy "reviews_customer_insert" on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = reviews.order_id
        and o.user_id = auth.uid()
        and o.status = 'delivered'
    )
  );

create policy "reviews_supplier_reply" on public.reviews
  for update using (public.is_supplier_member(supplier_id))
  with check (public.is_supplier_member(supplier_id));

-- ---------------------------------------------------------
-- payouts: fornecedor vê os seus; admin tudo
-- ---------------------------------------------------------
create policy "payouts_supplier_read" on public.payouts
  for select using (public.is_supplier_member(supplier_id));

create policy "payouts_admin_all" on public.payouts
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "payout_orders_supplier_read" on public.payout_orders
  for select using (
    exists (
      select 1 from public.payouts p
      where p.id = payout_orders.payout_id and public.is_supplier_member(p.supplier_id)
    )
  );

create policy "payout_orders_admin_all" on public.payout_orders
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------------------------------------------------------
-- payment_cards: dono CRUD
-- ---------------------------------------------------------
create policy "payment_cards_owner_all" on public.payment_cards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------
-- notifications: dono lê/marca lido; sistema insere via service-role
-- ---------------------------------------------------------
create policy "notifications_owner_read" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_owner_update" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------
-- expo_push_tokens: dono CRUD
-- ---------------------------------------------------------
create policy "expo_tokens_owner_all" on public.expo_push_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------
-- waitlist: insert público; leitura admin
-- ---------------------------------------------------------
create policy "waitlist_public_insert" on public.waitlist
  for insert with check (true);

create policy "waitlist_admin_read" on public.waitlist
  for select using (public.is_platform_admin());
