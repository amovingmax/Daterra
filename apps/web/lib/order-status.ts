import type { OrderStatus } from '@daterra/shared';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Aguardando pagamento',
  received: 'Novo',
  accepted: 'Aceito',
  preparing: 'Em preparo',
  ready: 'Pronto',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export const STATUS_TONE: Record<OrderStatus, Tone> = {
  pending_payment: 'warning',
  received: 'info',
  accepted: 'info',
  preparing: 'warning',
  ready: 'success',
  out_for_delivery: 'success',
  delivered: 'success',
  cancelled: 'danger',
};

export const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-sand-100 text-ink-secondary',
  info: 'bg-brand-50 text-brand-700',
  warning: 'bg-gold-100 text-gold-500',
  success: 'bg-status-success/15 text-status-success',
  danger: 'bg-status-danger/15 text-status-danger',
};

/** Próximas transições válidas a partir de um status, do ponto de vista do fornecedor. */
export function nextActions(status: OrderStatus): { to: OrderStatus; label: string }[] {
  switch (status) {
    case 'received':
      return [
        { to: 'accepted', label: 'Aceitar pedido' },
        { to: 'cancelled', label: 'Recusar' },
      ];
    case 'accepted':
      return [{ to: 'preparing', label: 'Marcar em preparo' }];
    case 'preparing':
      return [{ to: 'ready', label: 'Marcar como pronto' }];
    case 'ready':
      return [{ to: 'out_for_delivery', label: 'Saiu para entrega' }];
    case 'out_for_delivery':
      return [{ to: 'delivered', label: 'Marcar como entregue' }];
    default:
      return [];
  }
}
