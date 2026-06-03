import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';

interface FavoritesContextValue {
  supplierIds: Set<string>;
  productIds: Set<string>;
  isFavoriteSupplier: (id: string) => boolean;
  isFavoriteProduct: (id: string) => boolean;
  toggleSupplier: (id: string) => Promise<void>;
  toggleProduct: (id: string) => Promise<void>;
  reload: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [supplierIds, setSupplierIds] = useState<Set<string>>(new Set());
  const [productIds, setProductIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) {
      setSupplierIds(new Set());
      setProductIds(new Set());
      return;
    }
    const { data } = await supabase
      .from('favorites')
      .select('supplier_id, product_id')
      .eq('user_id', user.id);
    const sup = new Set<string>();
    const prod = new Set<string>();
    for (const f of data ?? []) {
      if (f.supplier_id) sup.add(f.supplier_id);
      if (f.product_id) prod.add(f.product_id);
    }
    setSupplierIds(sup);
    setProductIds(prod);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSupplier = useCallback(
    async (id: string) => {
      if (!user) return;
      const isFav = supplierIds.has(id);
      setSupplierIds((prev) => {
        const n = new Set(prev);
        if (isFav) n.delete(id);
        else n.add(id);
        return n;
      });
      const { error } = isFav
        ? await supabase.from('favorites').delete().eq('user_id', user.id).eq('supplier_id', id)
        : await supabase.from('favorites').insert({ user_id: user.id, supplier_id: id });
      if (error) load(); // reverte recarregando
    },
    [user?.id, supplierIds, load],
  );

  const toggleProduct = useCallback(
    async (id: string) => {
      if (!user) return;
      const isFav = productIds.has(id);
      setProductIds((prev) => {
        const n = new Set(prev);
        if (isFav) n.delete(id);
        else n.add(id);
        return n;
      });
      const { error } = isFav
        ? await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id)
        : await supabase.from('favorites').insert({ user_id: user.id, product_id: id });
      if (error) load();
    },
    [user?.id, productIds, load],
  );

  return (
    <FavoritesContext.Provider
      value={{
        supplierIds,
        productIds,
        isFavoriteSupplier: (id) => supplierIds.has(id),
        isFavoriteProduct: (id) => productIds.has(id),
        toggleSupplier,
        toggleProduct,
        reload: load,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites deve ser usado dentro de <FavoritesProvider>');
  return ctx;
}
