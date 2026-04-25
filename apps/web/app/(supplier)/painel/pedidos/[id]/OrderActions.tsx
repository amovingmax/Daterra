'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import type { OrderStatus } from '@daterra/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { nextActions } from '@/lib/order-status';

export function OrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = nextActions(status);
  if (actions.length === 0) return null;

  function handleAction(to: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const update: Partial<{
        status: OrderStatus;
        cancelled_by: 'supplier';
        cancellation_reason: 'out_of_stock';
      }> = { status: to };
      if (to === 'cancelled') {
        update.cancelled_by = 'supplier';
        update.cancellation_reason = 'out_of_stock';
      }
      const { error: updErr } = await supabase
        .from('orders')
        .update(update)
        .eq('id', orderId);
      if (updErr) {
        setError(updErr.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const isDanger = action.to === 'cancelled';
          return (
            <button
              key={action.to}
              type="button"
              disabled={pending}
              onClick={() => handleAction(action.to)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-60 ${
                isDanger
                  ? 'border border-status-danger text-status-danger hover:bg-status-danger/10'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}
            >
              {pending ? 'Atualizando...' : action.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-status-danger/10 p-3 text-sm text-status-danger">
          {error}
        </p>
      )}
    </div>
  );
}
