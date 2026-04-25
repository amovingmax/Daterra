import Link from 'next/link';
import { formatBRL } from '@daterra/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentSupplier } from '@/lib/supabase/get-current-supplier';

export default async function DashboardPage() {
  const current = await getCurrentSupplier();
  if (!current) return null; // layout já tratou

  const supabase = await createSupabaseServerClient();
  const supplierId = current.supplier.id;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [todayOrders, weekOrders, products] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total_cents, status, created_at')
      .eq('supplier_id', supplierId)
      .gte('created_at', since24h),
    supabase.from('orders').select('id').eq('supplier_id', supplierId).gte('created_at', since7d),
    supabase
      .from('products')
      .select('id, is_active, price_cents')
      .eq('supplier_id', supplierId),
  ]);

  const todayCount = todayOrders.data?.length ?? 0;
  const todayRevenue =
    todayOrders.data?.reduce((acc, o) => acc + (o.total_cents ?? 0), 0) ?? 0;
  const weekCount = weekOrders.data?.length ?? 0;
  const productCount = products.data?.length ?? 0;
  const productsActive = products.data?.filter((p) => p.is_active).length ?? 0;
  const productsMissingPrice = products.data?.filter((p) => p.price_cents === null).length ?? 0;

  const kpis = [
    { label: 'Pedidos hoje', value: String(todayCount) },
    { label: 'Faturamento hoje', value: formatBRL(todayRevenue) },
    { label: 'Pedidos da semana', value: String(weekCount) },
    { label: 'Produtos ativos', value: `${productsActive}/${productCount}` },
  ];

  const supplierActive = current.supplier.is_active;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brand-700">Dashboard</h1>
      <p className="mt-2 text-ink-secondary">
        Visão geral da {current.supplier.name} no Da Terra.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-ink-secondary">{kpi.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink-primary">{kpi.value}</p>
          </div>
        ))}
      </div>

      {(!supplierActive || productsMissingPrice > 0) && (
        <section className="mt-8 rounded-2xl border border-status-warning/30 bg-gold-50 p-6">
          <h2 className="font-display text-lg font-semibold text-brand-700">
            Para receber pedidos, você ainda precisa:
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-primary">
            {!supplierActive && (
              <li className="flex items-start gap-2">
                <span>⏳</span>
                <span>
                  Aguardar a equipe Da Terra ativar sua loja (validação do CNPJ junto ao programa
                  Feito Potiguar).
                </span>
              </li>
            )}
            {productsMissingPrice > 0 && (
              <li className="flex items-start gap-2">
                <span>💰</span>
                <span>
                  <Link href="/painel/cardapio" className="text-brand-500 underline">
                    Definir preço em {productsMissingPrice}{' '}
                    {productsMissingPrice === 1 ? 'produto' : 'produtos'}
                  </Link>
                  {productsMissingPrice > 0 ? ' (importados sem preço do site Feito Potiguar)' : ''}
                </span>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-700">Pedidos pendentes</h2>
        <p className="mt-3 text-sm text-ink-secondary">
          {todayCount === 0
            ? 'Nada pendente agora. Quando entrarem novos pedidos, eles aparecem aqui em destaque.'
            : `${todayCount} pedido(s) nas últimas 24h. `}
          {todayCount > 0 && (
            <Link href="/painel/pedidos" className="text-brand-500 underline">
              Ver tudo
            </Link>
          )}
        </p>
      </section>
    </div>
  );
}
