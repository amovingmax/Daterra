import Image from 'next/image';
import Link from 'next/link';
import { formatBRL } from '@daterra/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentSupplier } from '@/lib/supabase/get-current-supplier';

export default async function CardapioPage() {
  const current = await getCurrentSupplier();
  if (!current) return null;

  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('supplier_id', current.supplier.id)
    .order('created_at', { ascending: false });

  const list = products ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brand-700">Cardápio</h1>
          <p className="mt-2 text-ink-secondary">
            {list.length} {list.length === 1 ? 'produto' : 'produtos'} cadastrados
          </p>
        </div>
        <Link
          href="/painel/cardapio/novo"
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          + Novo produto
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-sand-200 bg-white p-12 text-center">
          <p className="text-5xl">🥫</p>
          <h2 className="mt-4 font-display text-xl font-semibold text-brand-700">
            Sem produtos ainda
          </h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Cadastre seu primeiro produto pra começar a vender no Da Terra.
          </p>
          <Link
            href="/painel/cardapio/novo"
            className="mt-6 inline-block rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Cadastrar produto
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product) => {
            const photo = product.photos?.[0];
            const needsPrice = product.price_cents === null;
            return (
              <Link
                key={product.id}
                href={`/painel/cardapio/${product.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-square bg-sand-100">
                  {photo ? (
                    <Image src={photo} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🥫</div>
                  )}
                  <div className="absolute right-2 top-2 flex flex-col gap-1">
                    {!product.is_active && (
                      <span className="rounded-full bg-ink-tertiary/90 px-2.5 py-1 text-xs font-medium text-white">
                        Inativo
                      </span>
                    )}
                    {needsPrice && (
                      <span className="rounded-full bg-status-warning/95 px-2.5 py-1 text-xs font-medium text-white">
                        Sem preço
                      </span>
                    )}
                    {product.promo_price_cents && (
                      <span className="rounded-full bg-accent-400/95 px-2.5 py-1 text-xs font-medium text-white">
                        Promoção
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between gap-2 p-4">
                  <p className="line-clamp-2 font-medium text-ink-primary">{product.name}</p>
                  <p className="font-display text-lg font-semibold text-brand-700">
                    {needsPrice
                      ? '—'
                      : product.promo_price_cents
                        ? formatBRL(product.promo_price_cents)
                        : formatBRL(product.price_cents!)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
