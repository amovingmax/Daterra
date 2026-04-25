import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentSupplier } from '@/lib/supabase/get-current-supplier';
import { ProductForm } from '@/components/ProductForm';

export default async function NewProductPage() {
  const current = await getCurrentSupplier();
  if (!current) return null;

  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, label, parent_slug')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/painel/cardapio"
        className="text-sm text-ink-secondary hover:text-brand-500"
      >
        ← Voltar pro cardápio
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-brand-700">
        Novo produto
      </h1>
      <p className="mt-2 text-ink-secondary">
        Cadastrando para {current.supplier.name}.
      </p>

      <div className="mt-8">
        <ProductForm
          supplierId={current.supplier.id}
          categories={categories ?? []}
        />
      </div>
    </div>
  );
}
