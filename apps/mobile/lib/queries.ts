import { supabase, type DBSupplier, type DBProduct, type DBOrder, type DBAddress } from './supabase';

/** Lista fornecedores ativos, ordenados por destaque. */
export async function listActiveSuppliers(): Promise<DBSupplier[]> {
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data ?? [];
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
