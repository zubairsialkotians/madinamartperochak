import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SHOP_KEY } from '../config';
import { round2, cleanQty } from '../services/qty';

const CART_KEY = `cart_${SHOP_KEY}`;
const CartContext = createContext(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}

/*
  Cart lines: { item_id, name, unit, price, image, qty, min_qty, qty_step, max_qty, qty_options }
  Kept on the phone (works for guests). Prices are refreshed from the server on the
  cart screen, and the server prices the order again when it's placed.
*/
export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY)
      .then((raw) => { if (raw) setLines(JSON.parse(raw) || []); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(CART_KEY, JSON.stringify(lines)).catch(() => {});
  }, [lines, loaded]);

  const lineFrom = (p, qty) => ({
    item_id: p.id, name: p.name, unit: p.unit, price: p.price, image: p.image,
    min_qty: p.min_qty, qty_step: p.qty_step, max_qty: p.max_qty, qty_options: p.qty_options || [], qty: cleanQty(qty),
  });

  // Adds to what's already in the cart
  const add = useCallback((p, qty) => {
    setLines((prev) => {
      const cur = prev.find((l) => l.item_id === p.id);
      if (!cur) return [...prev, lineFrom(p, qty)];
      return prev.map((l) => (l.item_id === p.id ? { ...lineFrom(p, l.qty + qty) } : l));
    });
  }, []);

  // Sets the exact quantity (0 removes)
  const setQty = useCallback((itemId, qty, product) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.item_id !== itemId);
      const cur = prev.find((l) => l.item_id === itemId);
      if (!cur) return product ? [...prev, lineFrom(product, qty)] : prev;
      return prev.map((l) => (l.item_id === itemId ? { ...l, qty: cleanQty(qty) } : l));
    });
  }, []);

  const remove = useCallback((itemId) => setLines((prev) => prev.filter((l) => l.item_id !== itemId)), []);
  const clear = useCallback(() => setLines([]), []);

  // Fresh product data from the server: update prices/limits, drop what's gone
  const sync = useCallback((products) => {
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));
    setLines((prev) => prev
      .filter((l) => byId[l.item_id])
      .map((l) => ({ ...lineFrom(byId[l.item_id], l.qty), qty: l.qty })));
  }, []);

  const value = useMemo(() => ({
    lines, loaded, add, setQty, remove, clear, sync,
    count: lines.length,
    qtyOf: (id) => lines.find((l) => l.item_id === id)?.qty || 0,
    subtotal: round2(lines.reduce((a, l) => a + round2(l.qty * l.price), 0)),
  }), [lines, loaded, add, setQty, remove, clear, sync]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
