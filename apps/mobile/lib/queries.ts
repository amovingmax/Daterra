import {
  supabase,
  type DBSupplier,
  type DBProduct,
  type DBOrder,
  type DBAddress,
  type DBNotification,
} from './supabase';
import type { AddressInput } from '@daterra/shared';

/** Lista fornecedores ativos, ordenados por destaque. */
export async function listActiveSuppliers(): Promise<DBSupplier[]> {
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export interface PromotionItem extends DBProduct {
  supplier_name: string;
  supplier_city: string | null;
}

/** Lista produtos ativos com promoção vigente (promo_price_cents + janela atual). */
export async function listActivePromotions(): Promise<PromotionItem[]> {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .not('promo_price_cents', 'is', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  const now = new Date();
  const inWindow = (products ?? []).filter((p) => {
    const start = p.promo_starts_at ? new Date(p.promo_starts_at) : null;
    const end = p.promo_ends_at ? new Date(p.promo_ends_at) : null;
    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  });

  if (inWindow.length === 0) return [];

  const supplierIds = Array.from(new Set(inWindow.map((p) => p.supplier_id)));
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, city')
    .in('id', supplierIds);
  const map = new Map((suppliers ?? []).map((s) => [s.id, s] as const));

  return inWindow.map((p) => {
    const supplier = map.get(p.supplier_id);
    return {
      ...p,
      supplier_name: supplier?.name ?? '',
      supplier_city: supplier?.city ?? null,
    };
  });
}

/** Top fornecedores rankeados por número de pedidos (RPC SECURITY DEFINER). */
export async function listPopularSuppliers(limit = 10): Promise<DBSupplier[]> {
  // Cast: RPC ainda não está em types.ts (foi adicionada na migration 08, sem regen).
  const { data } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .rpc('top_suppliers_by_orders' as any, { p_limit: limit });
  return ((data ?? []) as unknown) as DBSupplier[];
}

export async function getSupplier(id: string): Promise<DBSupplier | null> {
  const { data } = await supabase.from('suppliers').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function listSupplierProducts(supplierId: string): Promise<DBProduct[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('is_active', true)
    .order('sort_order')
    .order('name');
  return data ?? [];
}

export async function getProduct(id: string): Promise<DBProduct | null> {
  const { data } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function listMyAddresses(userId: string): Promise<DBAddress[]> {
  const { data } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function createAddress(
  userId: string,
  input: AddressInput,
): Promise<DBAddress | null> {
  // Constraint: 1 endereço primário por usuário. Se este vai virar primário,
  // desmarca os outros antes pra evitar erro de unique index.
  if (input.is_primary) {
    await supabase
      .from('addresses')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ is_primary: false } as any)
      .eq('user_id', userId);
  }
  const { data } = await supabase
    .from('addresses')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ ...input, user_id: userId } as any)
    .select()
    .single();
  return data;
}

export async function updateAddress(
  addressId: string,
  input: AddressInput,
  userId?: string,
): Promise<DBAddress | null> {
  if (input.is_primary && userId) {
    await supabase
      .from('addresses')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ is_primary: false } as any)
      .eq('user_id', userId)
      .neq('id', addressId);
  }
  const { data } = await supabase
    .from('addresses')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(input as any)
    .eq('id', addressId)
    .select()
    .single();
  return data;
}

export async function setAddressAsPrimary(
  addressId: string,
  userId: string,
): Promise<boolean> {
  // 1. Desmarca todos os outros
  await supabase
    .from('addresses')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ is_primary: false } as any)
    .eq('user_id', userId)
    .neq('id', addressId);
  // 2. Marca este
  const { error } = await supabase
    .from('addresses')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ is_primary: true } as any)
    .eq('id', addressId);
  return !error;
}

export async function deleteAddress(addressId: string): Promise<boolean> {
  const { error } = await supabase.from('addresses').delete().eq('id', addressId);
  return !error;
}

export async function updateProfile(
  userId: string,
  patch: { full_name?: string; phone?: string },
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', userId);
  return !error;
}

export async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export async function listNotifications(userId: string): Promise<DBNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function unreadNotificationsCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ read_at: new Date().toISOString() } as any)
    .eq('id', notificationId);
  return !error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ read_at: new Date().toISOString() } as any)
    .eq('user_id', userId)
    .is('read_at', null);
  return !error;
}

export async function listMyOrders(userId: string): Promise<DBOrder[]> {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export interface CreateOrderInput {
  user_id: string;
  supplier_id: string;
  items: {
    product_id: string;
    name: string;
    unit_price_cents: number;
    quantity: number;
    note: string | null;
  }[];
  delivery_address: DBAddress | null;
  delivery_provider: 'uber_direct' | 'loggi' | 'pickup';
  payment_method: 'pix' | 'credit_card';
}

export async function createOrder(input: CreateOrderInput): Promise<DBOrder | null> {
  const subtotalCents = input.items.reduce(
    (acc, i) => acc + i.unit_price_cents * i.quantity,
    0,
  );
  // Frete fake pra MVP: R$ 12,00 fixo (Uber Direct estimado)
  const deliveryCents = input.delivery_provider === 'pickup' ? 0 : 1200;
  const totalCents = subtotalCents + deliveryCents;

  const addressJson = input.delivery_address
    ? {
        zip_code: input.delivery_address.zip_code,
        street: input.delivery_address.street,
        number: input.delivery_address.number,
        complement: input.delivery_address.complement,
        district: input.delivery_address.district,
        city: input.delivery_address.city,
        state: input.delivery_address.state,
        reference: input.delivery_address.reference,
      }
    : null;

  // Criar order — comissão é calculada por trigger no banco
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: input.user_id,
      supplier_id: input.supplier_id,
      status: 'received',
      subtotal_cents: subtotalCents,
      delivery_cents: deliveryCents,
      discount_cents: 0,
      total_cents: totalCents,
      commission_cents: 0, // overridden pelo trigger
      payment_method: input.payment_method,
      payment_status: 'paid', // simulado pra MVP
      delivery_provider: input.delivery_provider,
      delivery_address: addressJson,
      // number gerado pelo trigger
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select()
    .single();

  if (error || !order) {
    // eslint-disable-next-line no-console
    console.warn('createOrder error', error);
    return null;
  }

  // Inserir items
  const itemsPayload = input.items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    name_snapshot: i.name,
    unit_price_cents: i.unit_price_cents,
    quantity: i.quantity,
    note: i.note,
    addons: [],
  }));
  const { error: itemsError } = await supabase
    .from('order_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(itemsPayload as any);
  if (itemsError) {
    // eslint-disable-next-line no-console
    console.warn('order_items insert error', itemsError);
  }

  return order;
}
