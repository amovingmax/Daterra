import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'daterra:cart-v1';

export interface CartItem {
  product_id: string;
  supplier_id: string;
  name: string;
  unit_price_cents: number;
  photo_url: string | null;
  quantity: number;
  note: string | null;
}

export interface Cart {
  supplier_id: string | null;
  supplier_name: string | null;
  items: CartItem[];
}

const EMPTY_CART: Cart = { supplier_id: null, supplier_name: null, items: [] };

interface CartContextValue {
  cart: Cart;
  hydrated: boolean;
  itemCount: number;
  subtotalCents: number;
  addItem: (
    item: Omit<CartItem, 'quantity'>,
    quantity: number,
    supplierName: string,
  ) => { ok: boolean; conflict?: { supplierName: string } };
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  forceReplace: (
    item: Omit<CartItem, 'quantity'>,
    quantity: number,
    supplierName: string,
  ) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setCart(JSON.parse(raw));
          } catch {
            // descarta cart corrompido
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cart)).catch(() => {});
    }
  }, [cart, hydrated]);

  const itemCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotalCents = cart.items.reduce((acc, i) => acc + i.unit_price_cents * i.quantity, 0);

  function addItem(
    item: Omit<CartItem, 'quantity'>,
    quantity: number,
    supplierName: string,
  ): { ok: boolean; conflict?: { supplierName: string } } {
    // PRD §10.6: MVP não permite produtos de fornecedores diferentes na mesma sacola
    if (cart.supplier_id && cart.supplier_id !== item.supplier_id) {
      return { ok: false, conflict: { supplierName: cart.supplier_name ?? 'outra loja' } };
    }
    setCart((prev) => {
      const existing = prev.items.find((i) => i.product_id === item.product_id);
      const items = existing
        ? prev.items.map((i) =>
            i.product_id === item.product_id ? { ...i, quantity: i.quantity + quantity } : i,
          )
        : [...prev.items, { ...item, quantity }];
      return {
        supplier_id: item.supplier_id,
        supplier_name: supplierName,
        items,
      };
    });
    return { ok: true };
  }

  function forceReplace(
    item: Omit<CartItem, 'quantity'>,
    quantity: number,
    supplierName: string,
  ) {
    setCart({
      supplier_id: item.supplier_id,
      supplier_name: supplierName,
      items: [{ ...item, quantity }],
    });
  }

  function setQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.product_id === productId ? { ...i, quantity } : i)),
    }));
  }

  function removeItem(productId: string) {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.product_id !== productId);
      if (items.length === 0) return EMPTY_CART;
      return { ...prev, items };
    });
  }

  function clearCart() {
    setCart(EMPTY_CART);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        hydrated,
        itemCount,
        subtotalCents,
        addItem,
        setQuantity,
        removeItem,
        clearCart,
        forceReplace,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>');
  return ctx;
}
