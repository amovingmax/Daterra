'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { productSchema, FEITO_POTIGUAR_CATEGORIES, slugify } from '@daterra/shared';
import { createBrowserClient } from '@/lib/supabase/client';

const MAX_PHOTOS = 5;

interface CategoryOption {
  slug: string;
  label: string;
  parent_slug: string | null;
}

interface ProductFormProps {
  supplierId: string;
  productId?: string; // edit mode
  categories: CategoryOption[];
  initial?: {
    name: string;
    description: string | null;
    category: string | null;
    subcategory: string | null;
    price_cents: number | null;
    promo_price_cents: number | null;
    stock: number | null;
    weight_grams: number | null;
    shelf_life_days: number | null;
    ingredients: string | null;
    photos: string[];
    is_active: boolean;
  };
}

const PARENT_CATEGORIES: string[] = FEITO_POTIGUAR_CATEGORIES.map((c) => c.slug);

function brlInputToCents(input: string): number | null {
  const cleaned = input.replace(/[^\d,.]/g, '').replace(',', '.');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (Number.isNaN(num) || num <= 0) return null;
  return Math.round(num * 100);
}

function centsToBRLInput(cents: number | null): string {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function ProductForm({ supplierId, productId, categories, initial }: ProductFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [priceInput, setPriceInput] = useState(centsToBRLInput(initial?.price_cents ?? null));
  const [promoPriceInput, setPromoPriceInput] = useState(
    centsToBRLInput(initial?.promo_price_cents ?? null),
  );
  const [stock, setStock] = useState<string>(
    initial?.stock !== null && initial?.stock !== undefined ? String(initial.stock) : '',
  );
  const [weightGrams, setWeightGrams] = useState<string>(
    initial?.weight_grams ? String(initial.weight_grams) : '',
  );
  const [shelfLifeDays, setShelfLifeDays] = useState<string>(
    initial?.shelf_life_days ? String(initial.shelf_life_days) : '',
  );
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? '');
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [isActive, setIsActive] = useState(initial?.is_active ?? false);

  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const subcategories = categories.filter((c) => c.parent_slug === category);
  const isParentCategory = PARENT_CATEGORIES.includes(category);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (photos.length + files.length > MAX_PHOTOS) {
      setGlobalError(`Máximo ${MAX_PHOTOS} fotos por produto.`);
      return;
    }

    setUploading(true);
    setGlobalError(null);
    const newUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${supplierId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('product-photos')
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        setGlobalError(`Falha no upload de ${file.name}: ${upErr.message}`);
        continue;
      }
      const { data } = supabase.storage.from('product-photos').getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    setPhotos((p) => [...p, ...newUrls]);
    setUploading(false);
    e.target.value = '';
  }

  function removePhoto(url: string) {
    setPhotos((p) => p.filter((u) => u !== url));
    // não removemos do storage agora — fica como órfão até cleanup periódico
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    const priceCents = priceInput ? brlInputToCents(priceInput) : null;
    const promoPriceCents = promoPriceInput ? brlInputToCents(promoPriceInput) : null;

    if (priceInput && priceCents === null) {
      setErrors({ price_cents: 'Preço inválido' });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      category: category || null,
      subcategory: isParentCategory && subcategory ? subcategory : null,
      price_cents: priceCents,
      promo_price_cents: promoPriceCents,
      stock: stock ? Number(stock) : null,
      weight_grams: weightGrams ? Number(weightGrams) : null,
      shelf_life_days: shelfLifeDays ? Number(shelfLifeDays) : null,
      ingredients: ingredients.trim() || null,
      photos,
      is_active: isActive,
    };

    // Validação parcial: o productSchema espera price_cents > 0 em ativos.
    // Aqui validamos só campos sempre obrigatórios (nome).
    if (!payload.name || payload.name.length < 2) {
      setErrors({ name: 'Nome é obrigatório (mínimo 2 caracteres)' });
      return;
    }
    if (payload.is_active && !payload.price_cents) {
      setErrors({ price_cents: 'Para ativar o produto, defina um preço.' });
      return;
    }

    // Para validação completa quando estamos ativando, usa schema
    if (payload.is_active) {
      const result = productSchema.safeParse({
        ...payload,
        price_cents: payload.price_cents!,
        photos: payload.photos,
      });
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const path = issue.path[0]?.toString() ?? '_';
          if (!newErrors[path]) newErrors[path] = issue.message;
        }
        setErrors(newErrors);
        return;
      }
    }

    startTransition(async () => {
      const slug = slugify(`${name}-${Date.now().toString(36)}`).slice(0, 80);
      // Cast: types.ts foi gerado antes das migrations 06/07; price_cents
      // realmente é nullable no banco. Regerar tipos resolve.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatePayload = payload as any;
      if (productId) {
        const { error } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productId);
        if (error) {
          setGlobalError(error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from('products')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert({ ...updatePayload, supplier_id: supplierId, slug } as any);
        if (error) {
          setGlobalError(error.message);
          return;
        }
      }
      router.push('/painel/cardapio');
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!productId) return;
    if (!confirm('Tem certeza que quer remover este produto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      setGlobalError(error.message);
      return;
    }
    router.push('/painel/cardapio');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title="Identificação">
        <Field label="Nome do produto" error={errors.name} required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Ex: Granola Salgada Artesanal"
            required
          />
        </Field>
        <Field label="Descrição" error={errors.description}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input"
            placeholder="Conte um pouco sobre o produto, origem, modo de produção..."
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria" error={errors.category}>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
              className="input"
            >
              <option value="">Selecione...</option>
              {FEITO_POTIGUAR_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </Field>
          {subcategories.length > 0 && (
            <Field label="Subcategoria">
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="input"
              >
                <option value="">—</option>
                {subcategories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </Section>

      <Section title="Fotos" subtitle={`${photos.length}/${MAX_PHOTOS}`}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-sand-100">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-sand-300 bg-white text-3xl text-ink-tertiary hover:border-brand-500 hover:text-brand-500">
              {uploading ? '⏳' : '+'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      </Section>

      <Section title="Preço">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preço (R$)" error={errors.price_cents}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary">R$</span>
              <input
                type="text"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="input pl-9"
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
          </Field>
          <Field label="Preço promocional (R$)" error={errors.promo_price_cents}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary">R$</span>
              <input
                type="text"
                value={promoPriceInput}
                onChange={(e) => setPromoPriceInput(e.target.value)}
                className="input pl-9"
                placeholder="opcional"
                inputMode="decimal"
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Logística e estoque">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Estoque" helper="Vazio = ilimitado">
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="input"
              placeholder="—"
            />
          </Field>
          <Field label="Peso (g)" helper="Pra cálculo de frete">
            <input
              type="number"
              min="0"
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              className="input"
              placeholder="500"
            />
          </Field>
          <Field label="Validade (dias)">
            <input
              type="number"
              min="0"
              value={shelfLifeDays}
              onChange={(e) => setShelfLifeDays(e.target.value)}
              className="input"
              placeholder="30"
            />
          </Field>
        </div>
        <Field label="Ingredientes / informações nutricionais">
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={3}
            className="input"
            placeholder="Lista de ingredientes, alérgicos, valores nutricionais..."
          />
        </Field>
      </Section>

      <Section title="Publicação">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-sand-300 text-brand-500 focus:ring-brand-500"
          />
          <div>
            <p className="font-medium text-ink-primary">Produto ativo</p>
            <p className="text-sm text-ink-secondary">
              Quando ativo, o produto aparece para os clientes do app. Inativo = só visível pra
              você. Pra ativar, é necessário ter pelo menos um preço definido.
            </p>
          </div>
        </label>
      </Section>

      {globalError && (
        <p className="rounded-lg bg-status-danger/10 p-3 text-sm text-status-danger">
          {globalError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-sand-200 pt-6">
        {productId ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-status-danger hover:bg-status-danger/10 disabled:opacity-50"
          >
            Remover produto
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/painel/cardapio')}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-ink-secondary hover:bg-sand-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || uploading}
            className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? 'Salvando...' : productId ? 'Salvar alterações' : 'Criar produto'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: white;
          border: 1px solid #d9cfb5;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          color: #2a2a2a;
        }
        .input:focus {
          outline: none;
          border-color: #2d5f3f;
        }
      `}</style>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-brand-700">{title}</h2>
        {subtitle && <span className="text-xs text-ink-tertiary">{subtitle}</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  helper,
  required,
  children,
}: {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-primary">
        {label}
        {required && <span className="ml-1 text-status-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-status-danger">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-ink-secondary">{helper}</p>
      ) : null}
    </div>
  );
}
