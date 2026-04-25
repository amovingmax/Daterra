import Link from 'next/link';
import { formatBRL, type OrderStatus } from '@daterra/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentSupplier } from '@/lib/supabase/get-current-supplier';
import { STATUS_LABEL, STATUS_TONE, TONE_CLASS } from '@/lib/order-status';

const ACTIVE_STATUSES: OrderStatus[] = [
  'received',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
];

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const showHistory = tab === 'historico';

  const current = await getCurrentSupplier();
  if (!current) return null;

  const supabase = await createSupabaseServerClient();
  const statuses = showHistory
    ? (['delivered', 'cancelled'] as OrderStatus[])
    : ACTIVE_STATUSES;

  const { data: orders } = await supabase
    .from('orders')
    .select('id, number, status, total_cents, created_at, user_id')
    .eq('supplier_id', current.supplier.id)
    .in('status', statuses)
    .order('created_at', { ascending: false })
    .limit(100);

  const list = orders ?? [];

  // Busca nomes dos clientes em uma query separada (evita problema de tipagem nos joins)
  const userIds = Array.from(new Set(list.map((o) => o.user_id)));
  const customerNames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      customerNames[p.id] = p.full_name;
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brand-700">Pedidos</h1>
      <p className="mt-2 text-ink-secondary">
        Gerencie pedidos da {current.supplier.name}.
      </p>

      <div className="mt-6 inline-flex rounded-full bg-white p-1 shadow-sm">
        <Link
          href="/painel/pedidos"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !showHistory ? 'bg-brand-500 text-white' : 'text-ink-secondary hover:text-brand-500'
          }`}
        >
          Em andamento
        </Link>
        <Link
          href="/painel/pedidos?tab=historico"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            showHistory ? 'bg-brand-500 text-white' : 'text-ink-secondary hover:text-brand-500'
          }`}
        >
          Histórico
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-sand-200 bg-white p-12 text-center">
          <p className="text-5xl">📦</p>
          <h2 className="mt-4 font-display text-xl font-semibold text-brand-700">
            {showHistory ? 'Sem pedidos no histórico' : 'Nenhum pedido em andamento'}
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            {showHistory
              ? 'Pedidos entregues ou cancelados aparecem aqui.'
              : 'Quando entrarem novos pedidos, eles aparecem aqui pra você aceitar.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-sand-50 text-left text-xs uppercase tracking-wider text-ink-tertiary">
              <tr>
                <th className="px-6 py-3 font-medium">Número</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Recebido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200/60">
              {list.map((order) => {
                const tone = TONE_CLASS[STATUS_TONE[order.status]];
                return (
                  <tr key={order.id} className="hover:bg-sand-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/painel/pedidos/${order.id}`}
                        className="font-mono text-brand-600 hover:underline"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-ink-primary">
                      {customerNames[order.user_id] ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-ink-primary">
                      {formatBRL(order.total_cents)}
                    </td>
                    <td className="px-6 py-4 text-ink-secondary">
                      {new Date(order.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
