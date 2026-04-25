import { z } from 'zod';
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  SUPPLIER_TYPES,
  FEITO_POTIGUAR_CATEGORIES,
  SUPPORTED_STATE,
} from '../constants/index';

const categorySlugs = FEITO_POTIGUAR_CATEGORIES.map((c) => c.slug) as [string, ...string[]];

export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF inválido')
  .transform((v) => v.replace(/\D/g, ''));

export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, 'CNPJ inválido')
  .transform((v) => v.replace(/\D/g, ''));

export const phoneSchema = z
  .string()
  .regex(/^\+?55?\s?\(?\d{2}\)?\s?9?\s?\d{4}-?\d{4}$/, 'Telefone inválido')
  .transform((v) => v.replace(/\D/g, ''));

export const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
  .transform((v) => v.replace(/\D/g, ''));

export const passwordSchema = z
  .string()
  .min(8, 'Senha precisa ter ao menos 8 caracteres')
  .regex(/\d/, 'Senha precisa ter ao menos 1 número');

export const signupSchema = z
  .object({
    full_name: z.string().min(3, 'Nome completo é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: phoneSchema,
    password: passwordSchema,
    password_confirm: z.string(),
    accepted_terms: z.literal(true, {
      errorMap: () => ({ message: 'Você precisa aceitar os termos' }),
    }),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Senhas não conferem',
    path: ['password_confirm'],
  });

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const addressSchema = z.object({
  label: z.string().min(1).max(40),
  zip_code: cepSchema,
  street: z.string().min(1).max(120),
  number: z.string().min(1).max(20),
  complement: z.string().max(80).nullable().optional(),
  district: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  state: z.literal(SUPPORTED_STATE, {
    errorMap: () => ({
      message: 'Por enquanto atendemos só no Rio Grande do Norte. Em breve em outros estados!',
    }),
  }),
  reference: z.string().max(160).nullable().optional(),
  is_primary: z.boolean().default(false),
});

export const productVariationSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(40),
  price_cents: z.number().int().positive(),
});

export const productAddonSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(40),
  price_cents: z.number().int().nonnegative(),
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).nullable().optional(),
  category: z.enum(categorySlugs),
  subcategory: z.string().max(60).nullable().optional(),
  price_cents: z.number().int().positive(),
  promo_price_cents: z.number().int().positive().nullable().optional(),
  promo_starts_at: z.string().datetime().nullable().optional(),
  promo_ends_at: z.string().datetime().nullable().optional(),
  stock: z.number().int().nonnegative().nullable().optional(),
  weight_grams: z.number().int().positive().nullable().optional(),
  shelf_life_days: z.number().int().positive().nullable().optional(),
  ingredients: z.string().max(2000).nullable().optional(),
  photos: z.array(z.string().url()).max(5),
  variations: z.array(productVariationSchema).nullable().optional(),
  addons: z.array(productAddonSchema).nullable().optional(),
  is_active: z.boolean().default(true),
});

export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  variation_id: z.string().nullable(),
  addon_ids: z.array(z.string()),
  quantity: z.number().int().positive().max(99),
  note: z.string().max(200).nullable(),
});

export const checkoutSchema = z.object({
  supplier_id: z.string().uuid(),
  items: z.array(cartItemSchema).min(1, 'Sacola vazia'),
  delivery_address_id: z.string().uuid().nullable(),
  delivery_provider: z.enum(['uber_direct', 'loggi', 'pickup']),
  payment_method: z.enum(PAYMENT_METHODS),
  coupon_code: z.string().min(2).max(40).nullable().optional(),
});

export const reviewSchema = z.object({
  rating_store: z.number().int().min(1).max(5),
  rating_delivery: z.number().int().min(1).max(5).nullable().optional(),
  comment: z.string().max(800).nullable().optional(),
  tags: z.array(z.string()).max(10).default([]),
  photos: z.array(z.string().url()).max(5).default([]),
});

export const cancelOrderSchema = z.object({
  reason: z.enum([
    'changed_mind',
    'wrong_item',
    'too_long',
    'price_issue',
    'address_issue',
    'other',
  ]),
  detail: z.string().max(400).optional(),
});

export const supplierProfileSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.enum(SUPPLIER_TYPES),
  cnpj: cnpjSchema,
  description: z.string().max(800).nullable().optional(),
  story: z.string().max(4000).nullable().optional(),
  primary_category: z.enum(categorySlugs),
  whatsapp: phoneSchema.nullable().optional(),
  instagram: z.string().max(60).nullable().optional(),
});

export type Signup = z.infer<typeof signupSchema>;
export type Login = z.infer<typeof loginSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type SupplierProfileInput = z.infer<typeof supplierProfileSchema>;
