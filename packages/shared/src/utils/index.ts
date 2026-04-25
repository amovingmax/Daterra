import { COMMISSION_RATE } from '../constants/index';
import type { Cents } from '../types/index';

/** Formata centavos como BRL: 1234 → "R$ 12,34". */
export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/** Calcula a comissão da plataforma sobre o subtotal de produto (não inclui frete). */
export function calculateCommission(productSubtotalCents: Cents): Cents {
  return Math.round(productSubtotalCents * COMMISSION_RATE);
}

/** Calcula valor líquido devido ao fornecedor após comissão. */
export function calculateSupplierPayout(productSubtotalCents: Cents): Cents {
  return productSubtotalCents - calculateCommission(productSubtotalCents);
}

/** Slugify simples para nomes de fornecedor / produto. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Máscara de CEP: 12345678 → "12345-678". */
export function maskCEP(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Máscara de telefone BR: 84912345678 → "(84) 9 1234-5678". */
export function maskPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

/** Máscara de CPF: 12345678901 → "123.456.789-01". */
export function maskCPF(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** Máscara de CNPJ: 12345678000190 → "12.345.678/0001-90". */
export function maskCNPJ(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** Distância em km entre dois pontos (Haversine). */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}

/** Geração de número de pedido legível: "DT-2026-000123". */
export function buildOrderNumber(year: number, sequence: number): string {
  return `DT-${year}-${sequence.toString().padStart(6, '0')}`;
}
