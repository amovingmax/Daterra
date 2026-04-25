-- =========================================================
-- Funções de domínio
-- =========================================================

-- Comissão Da Terra: 15% sobre o valor do produto (PRD §10.1)
create or replace function public.calculate_commission(subtotal_cents int)
returns int language sql immutable as $$
  select round(subtotal_cents * 0.15)::int;
$$;

-- Geração de número legível de pedido: DT-YYYY-000123
create or replace function public.generate_order_number()
returns text language plpgsql as $$
declare
  seq bigint;
begin
  seq := nextval('public.order_number_seq');
  return 'DT-' || extract(year from now())::text || '-' || lpad(seq::text, 6, '0');
end;
$$;

-- Trigger: ao criar uma order, gera number e calcula commission
create or replace function public.before_insert_order()
returns trigger language plpgsql as $$
begin
  if new.number is null or new.number = '' then
    new.number := public.generate_order_number();
  end if;
  if new.commission_cents is null or new.commission_cents = 0 then
    new.commission_cents := public.calculate_commission(new.subtotal_cents);
  end if;
  return new;
end;
$$;

create trigger orders_before_insert before insert on public.orders
  for each row execute function public.before_insert_order();

-- Trigger: log de mudança de status em order_status_history
create or replace function public.log_order_status_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) or tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger orders_log_status_change
  after insert or update of status on public.orders
  for each row execute function public.log_order_status_change();

-- Trigger: timeline (accepted_at, ready_at, etc.) ao mudar status
create or replace function public.stamp_order_timeline()
returns trigger language plpgsql as $$
begin
  if old.status is distinct from new.status then
    case new.status
      when 'accepted'         then new.accepted_at         := coalesce(new.accepted_at, now());
      when 'ready'            then new.ready_at            := coalesce(new.ready_at, now());
      when 'out_for_delivery' then new.out_for_delivery_at := coalesce(new.out_for_delivery_at, now());
      when 'delivered'        then new.delivered_at        := coalesce(new.delivered_at, now());
      when 'cancelled'        then new.cancelled_at        := coalesce(new.cancelled_at, now());
      else null;
    end case;
  end if;
  return new;
end;
$$;

create trigger orders_stamp_timeline before update on public.orders
  for each row execute function public.stamp_order_timeline();

-- Helper para RLS: o usuário gerencia este fornecedor?
create or replace function public.is_supplier_member(_supplier_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.supplier_users
    where supplier_id = _supplier_id and user_id = auth.uid()
  );
$$;

-- Helper para RLS: o usuário é admin Da Terra?
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer as $$
  select coalesce(
    (auth.jwt() ->> 'role') = 'platform_admin'
    or (auth.jwt() -> 'app_metadata' ->> 'platform_admin')::boolean,
    false
  );
$$;

-- Cria profile automaticamente quando um usuário é criado em auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', new.phone, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- View materializada: rating agregado por fornecedor
create or replace view public.supplier_ratings as
select
  s.id as supplier_id,
  count(r.id) as total_reviews,
  coalesce(round(avg(r.rating_store)::numeric, 2), 0) as avg_store,
  coalesce(round(avg(r.rating_delivery)::numeric, 2), 0) as avg_delivery
from public.suppliers s
left join public.reviews r on r.supplier_id = s.id
group by s.id;
