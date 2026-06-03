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

/** Ícone Ionicons por tipo de fornecedor. */
const SUPPLIER_TYPE_ICON: Record<string, IoniconName> = {
  producer: 'leaf-outline',
  restaurant: 'restaurant-outline',
  hospitality: 'bed-outline',
};

export const supplierTypeIcon = (type: string | null): IoniconName =>
  (type && SUPPLIER_TYPE_ICON[type]) || 'storefront-outline';
