import { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

/** Ícone Ionicons por slug de categoria Feito Potiguar. */
const CATEGORY_ICON: Record<string, IoniconName> = {
  'alimentos-naturais': 'nutrition-outline',
  'alimentos-prontos': 'fast-food-outline',
  bebidas: 'wine-outline',
  conservas: 'cube-outline',
  'doces-e-temperos': 'ice-cream-outline',
  'origem-animal': 'egg-outline',
  'bares-e-restaurantes': 'restaurant-outline',
  hospedagem: 'bed-outline',
};

export const categoryIcon = (slug: string | null): IoniconName =>
  (slug && CATEGORY_ICON[slug]) || 'pricetag-outline';

/**
 * Foto representativa por categoria Feito Potiguar.
 * Banco: Unsplash (hotlink livre pela Unsplash License). Recorte quadrado 400x400.
 */
const CATEGORY_IMAGE: Record<string, string> = {
  'alimentos-naturais':
    'https://images.unsplash.com/photo-1622542086073-dcdc3350cc2b?ixlib=rb-4.0.3&auto=format&fit=crop&crop=entropy&w=400&h=400&q=70',
  'alimentos-prontos':
    'https://images.unsplash.com/photo-1752367798938-f1fac36c6d4c?ixlib=rb-4.0.3&auto=format&fit=crop&crop=entropy&w=400&h=400&q=70',
  bebidas:
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?ixlib=rb-4.0.3&auto=format&fit=crop&crop=entropy&w=400&h=400&q=70',
  conservas:
    'https://images.unsplash.com/photo-1640348784724-93f7b14d8047?ixlib=rb-4.0.3&auto=format&fit=crop&crop=entropy&w=400&h=400&q=70',
  'doces-e-temperos':
    'https://images.unsplash.com/photo-1662577587843-6d04530f1092?ixlib=rb-4.0.3&auto=format&fit=crop&crop=entropy&w=400&h=400&q=70',
  'origem-animal':
    'https://images.unsplash.com/photo-1677332698305-4275bc361bec?ixlib=rb-4.0.3&auto=format&fit=crop&crop=entropy&w=400&h=400&q=70',
  'bares-e-restaurantes':
    'https://images.unsplash.com/photo-1574966739987-65e38db0f7ce?ixlib=rb-4.0.3&auto=format&fit=crop&crop=entropy&w=400&h=400&q=70',
  hospedagem:
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&auto=format&fit=crop&crop=entropy&w=400&h=400&q=70',
};

export const categoryImage = (slug: string | null): string | null =>
  (slug && CATEGORY_IMAGE[slug]) || null;

/** Ícone Ionicons por tipo de fornecedor. */
const SUPPLIER_TYPE_ICON: Record<string, IoniconName> = {
  producer: 'leaf-outline',
  restaurant: 'restaurant-outline',
  hospitality: 'bed-outline',
};

export const supplierTypeIcon = (type: string | null): IoniconName =>
  (type && SUPPLIER_TYPE_ICON[type]) || 'storefront-outline';
