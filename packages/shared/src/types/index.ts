import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  SUPPLIER_TYPES,
  FEITO_POTIGUAR_CATEGORIES,
} from '../constants/index';

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type SupplierType = (typeof SUPPLIER_TYPES)[number];
export type CategorySlug = (typeof FEITO_POTIGUAR_CATEGORIES)[number]['slug'];

export type UUID = string;
export type ISODate = string;
export type Cents = number;

export interface Money {
  amount: Cents;
  currency: 'BRL';
}

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  phone: string;
  cpf: string | null;
  avatar_url: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Address {
  id: UUID;
  user_id: UUID;
  label: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
}

export interface Supplier {
  id: UUID;
  slug: string;
  name: string;
  type: SupplierType;
  cnpj: string;
  description: string | null;
  story: string | null;
  logo_url: string | null;
  cover_url: string | null;
  city: string;
  state: string;
  primary_category: CategorySlug;
  feito_potiguar_certified_at: ISODate;
  feito_potiguar_valid_until: ISODate | null;
  whatsapp: string | null;
  instagram: string | null;
  is_active: boolean;
  created_at: ISODate;
}

export interface Product {
  id: UUID;
  supplier_id: UUID;
  name: string;
  slug: string;
  description: string | null;
  category: CategorySlug;
  subcategory: string | null;
  price_cents: Cents;
  promo_price_cents: Cents | null;
  promo_starts_at: ISODate | null;
  promo_ends_at: ISODate | null;
  stock: number | null;
  weight_grams: number | null;
  shelf_life_days: number | null;
  ingredients: string | null;
  photos: string[];
  variations: ProductVariation[] | null;
  addons: ProductAddon[] | null;
  is_active: boolean;
  created_at: ISODate;
}

export interface ProductVariation {
  id: string;
  label: string;
  price_cents: Cents;
}

export interface ProductAddon {
  id: string;
  label: string;
  price_cents: Cents;
}

export interface CartItem {
  product_id: UUID;
  variation_id: string | null;
  addon_ids: string[];
  quantity: number;
  note: string | null;
}

export interface Order {
  id: UUID;
  number: string;
  user_id: UUID;
  supplier_id: UUID;
  status: OrderStatus;
  items: OrderItem[];
  subtotal_cents: Cents;
  delivery_cents: Cents;
  discount_cents: Cents;
  total_cents: Cents;
  payment_method: PaymentMethod;
  payment_id: string | null;
  delivery_address_id: UUID | null;
  delivery_provider: 'uber_direct' | 'loggi' | 'pickup' | null;
  coupon_code: string | null;
  cancellation_reason: string | null;
  created_at: ISODate;
  accepted_at: ISODate | null;
  delivered_at: ISODate | null;
}

export interface OrderItem {
  product_id: UUID;
  name_snapshot: string;
  unit_price_cents: Cents;
  quantity: number;
  variation_label: string | null;
  addons: { label: string; price_cents: Cents }[];
  note: string | null;
}

export interface Review {
  id: UUID;
  order_id: UUID;
  user_id: UUID;
  supplier_id: UUID;
  rating_store: number;
  rating_delivery: number | null;
  comment: string | null;
  tags: string[];
  photos: string[];
  supplier_reply: string | null;
  created_at: ISODate;
}

export interface Coupon {
  id: UUID;
  code: string;
  discount_kind: 'percent' | 'fixed';
  discount_value: number;
  min_order_cents: Cents | null;
  starts_at: ISODate;
  ends_at: ISODate;
  usage_limit: number | null;
  uses_count: number;
}

export interface Payout {
  id: UUID;
  supplier_id: UUID;
  amount_cents: Cents;
  status: 'scheduled' | 'processing' | 'paid' | 'failed';
  scheduled_for: ISODate;
  paid_at: ISODate | null;
  pix_key: string;
}
