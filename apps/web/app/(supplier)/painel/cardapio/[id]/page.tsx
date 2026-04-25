import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentSupplier } from '@/lib/supabase/get-current-supplier';
import { ProductForm } from '@/components/ProductForm';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentSupplier();
  if (!current) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('supplier_id', current.supplier.id)
      .maybeSingle(),
    supabase
      .from('categories')
      .select('slug, label, parent_slug')
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/painel/cardapio" className="text-sm text-ink-secondary hover:text-brand-500">
        ← Voltar pro cardápio
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-brand-700">{product.name}</h1>
      <p className="mt-2 text-ink-secondary">Edite os dados do produto.</p>

      <div className="mt-8">
        <ProductForm
          supplierId={current.supplier.id}
          productId={product.id}
          categories={categories ?? []}
          initial={{
            name: product.name,
            description: product.description,
            category: product.category,
            subcategory: product.subcategory,
            price_cents: product.price_cents,
            promo_price_cents: product.promo_price_cents,
            stock: product.stock,
            weight_grams: product.weight_grams,
            shelf_life_days: product.shelf_life_days,
            ingredients: product.ingredients,
            photos: product.photos ?? [],
            is_active: product.is_active,
          }}
        />
      </div>
    </div>
  );
}
