import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatBRL } from '@daterra/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentSupplier } from '@/lib/supabase/get-current-supplier';
import { STATUS_LABEL, STATUS_TONE, TONE_CLASS } from '@/lib/order-status';
import { OrderActions } from './OrderActions';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentSupplier();
  if (!current) return null;

  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('supplier_id', current.supplier.id)
    .maybeSingle();

  if (!order) notFound();

  // Buscas auxiliares em queries separadas (evita problemas de tipagem nos joins do Supabase)
  const [{ data: customer }, { data: items }, { data: timeline }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', order.user_id)
      .maybeSingle(),
    supabase.from('order_items').select('*').eq('order_id', order.id),
    supabase
      .from('order_status_history')
      .select('status, created_at')
      .eq('order_id', order.id)
      .order('created_at'),
  ]);

  const address = order.delivery_address as {
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  } | null;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/painel/pedidos" className="text-sm text-ink-secondary hover:text-brand-500">
        ← Voltar pra lista
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-tertiary">Pedido</p>
          <h1 className="font-display text-3xl font-semibold text-brand-700">{order.number}</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {new Date(order.created_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${TONE_CLASS[STATUS_TONE[order.status]]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-700">Próximas ações</h2>
        <div className="mt-4">
          <OrderActions orderId={order.id} status={order.status} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-700">Cliente</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div>
              <dt className="text-ink-tertiary">Nome</dt>
              <dd className="text-ink-primary">{customer?.full_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">Telefone</dt>
              <dd className="text-ink-primary">{customer?.phone ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-700">Entrega</h2>
          {address ? (
            <p className="mt-3 text-sm text-ink-primary">
              {address.street}, {address.number}
              {address.complement ? ` · ${address.complement}` : ''}
              <br />
              {address.district} · {address.city}/{address.state}
              <br />
              CEP {address.zip_code}
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink-secondary">Retirada no local</p>
          )}
          <p className="mt-3 text-xs text-ink-tertiary">
            Provedor: {order.delivery_provider ?? '—'}
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-700">Itens do pedido</h2>
        <ul className="mt-4 divide-y divide-sand-200/60">
          {(items ?? []).map((item) => (
            <li key={item.id} className="flex items-start justify-between py-3">
              <div>
                <p className="font-medium text-ink-primary">
                  {item.quantity}× {item.name_snapshot}
                </p>
                {item.variation_label && (
                  <p className="text-xs text-ink-secondary">{item.variation_label}</p>
                )}
                {item.note && (
                  <p className="mt-1 text-xs italic text-ink-secondary">📝 {item.note}</p>
                )}
              </div>
              <p className="font-medium text-ink-primary">
                {formatBRL(item.unit_price_cents * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1 border-t border-sand-200/60 pt-4 text-sm">
          <div className="flex justify-between text-ink-secondary">
            <dt>Subtotal</dt>
            <dd>{formatBRL(order.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between text-ink-secondary">
            <dt>Entrega</dt>
            <dd>{formatBRL(order.delivery_cents)}</dd>
          </div>
          {order.discount_cents > 0 && (
            <div className="flex justify-between text-status-success">
              <dt>Desconto</dt>
              <dd>-{formatBRL(order.discount_cents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-sand-200/60 pt-2 font-semibold text-ink-primary">
            <dt>Total</dt>
            <dd>{formatBRL(order.total_cents)}</dd>
          </div>
          <div className="flex justify-between text-xs text-ink-tertiary">
            <dt>Comissão Da Terra (15%)</dt>
            <dd>-{formatBRL(order.commission_cents)}</dd>
          </div>
          <div className="flex justify-between text-xs font-medium text-status-success">
            <dt>Líquido pra você</dt>
            <dd>{formatBRL(order.subtotal_cents - order.commission_cents)}</dd>
          </div>
        </dl>
      </section>

      {timeline && timeline.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-700">Histórico</h2>
          <ol className="mt-4 space-y-2 text-sm">
            {timeline.map((entry, i) => (
              <li key={i} className="flex justify-between text-ink-secondary">
                <span>{STATUS_LABEL[entry.status]}</span>
                <span className="text-xs">
                  {new Date(entry.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
