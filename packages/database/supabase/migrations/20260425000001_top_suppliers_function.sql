-- =========================================================
-- Função: top_suppliers_by_orders
-- =========================================================
-- Retorna fornecedores ativos rankeados por número de pedidos não-cancelados.
-- SECURITY DEFINER pra agregar pedidos de todos os usuários sem violar a
-- RLS de orders (que só permite ler os próprios pedidos).

create or replace function public.top_suppliers_by_orders(p_limit int default 10)
returns setof public.suppliers
language sql
security definer
stable
set search_path = public
as $$
  select s.*
  from public.suppliers s
  left join (
    select supplier_id, count(*) as order_count
    from public.orders
    where status != 'cancelled'
    group by supplier_id
  ) o on o.supplier_id = s.id
  where s.is_active = true
  order by coalesce(o.order_count, 0) desc, s.created_at desc
  limit p_limit;
$$;

grant execute on function public.top_suppliers_by_orders(int) to anon, authenticated;
