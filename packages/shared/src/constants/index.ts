export const PLATFORM_NAME = 'Da Terra';

/** Comissão da plataforma sobre valor do produto (não incide sobre frete). */
export const COMMISSION_RATE = 0.15;

/** Repasse ao fornecedor: D+7 corridos após confirmação de entrega. */
export const PAYOUT_DAYS = 7;

/** Tempo (em minutos) que o fornecedor tem para aceitar um pedido novo. */
export const SUPPLIER_ACCEPT_WINDOW_MIN = 15;

/** TTL do código Pix antes de expirar (minutos). */
export const PIX_EXPIRATION_MIN = 15;

/** Janela do cliente para cancelamento livre (até status "Aceito"). */
export const FREE_CANCEL_STATUSES = ['pending_payment', 'received', 'accepted'] as const;

/** UF atendida no MVP. */
export const SUPPORTED_STATE = 'RN' as const;

/** Estados alvo para expansão futura (V3). */
export const ROADMAP_STATES = ['PE', 'CE'] as const;

/** Status do pedido (alinhado com a tabela 10.2 do PRD). */
export const ORDER_STATUSES = [
  'pending_payment',
  'received',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

/** Métodos de pagamento suportados. */
export const PAYMENT_METHODS = ['pix', 'credit_card'] as const;

/** Tipos de fornecedor (PRD §2). */
export const SUPPLIER_TYPES = ['producer', 'restaurant', 'hospitality'] as const;

/** Categorias do programa Feito Potiguar (PRD §8.11). */
export const FEITO_POTIGUAR_CATEGORIES = [
  { slug: 'alimentos-naturais', label: 'Alimentos Naturais', icon: '🥜' },
  { slug: 'alimentos-prontos', label: 'Alimentos Prontos', icon: '🍽️' },
  { slug: 'bebidas', label: 'Bebidas', icon: '🍷' },
  { slug: 'conservas', label: 'Conservas', icon: '🥫' },
  { slug: 'doces-e-temperos', label: 'Doces e Temperos', icon: '🍯' },
  { slug: 'origem-animal', label: 'Origem Animal', icon: '🧀' },
  { slug: 'bares-e-restaurantes', label: 'Bares e Restaurantes', icon: '🍴' },
  { slug: 'hospedagem', label: 'Hospedagem', icon: '🏨' },
] as const;

/** Subcategorias por categoria-pai. */
export const SUBCATEGORIES: Record<string, readonly string[]> = {
  'alimentos-naturais': ['Granolas', 'Castanhas', 'Farinhas'],
  'origem-animal': ['Queijos', 'Iogurtes', 'Carnes', 'Mel'],
  'doces-e-temperos': ['Geleias', 'Doces', 'Rapaduras', 'Pimentas'],
  bebidas: ['Sucos', 'Cervejas artesanais', 'Cachaças', 'Café'],
  conservas: ['Picles', 'Compotas'],
  'alimentos-prontos': ['Tapiocas', 'Pratos prontos congelados'],
};

/** Cidades-base do RN (a lista completa é resolvida via IBGE/ViaCEP em runtime). */
export const RN_MAJOR_CITIES = [
  'Natal',
  'Mossoró',
  'Parnamirim',
  'São Gonçalo do Amarante',
  'Macaíba',
  'Ceará-Mirim',
  'Currais Novos',
  'Caicó',
  'Açu',
  'Apodi',
  'Pau dos Ferros',
  'João Câmara',
  'Touros',
  'Nísia Floresta',
  'Extremoz',
] as const;
