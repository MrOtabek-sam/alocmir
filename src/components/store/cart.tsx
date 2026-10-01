import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { track } from "@/lib/analytics";

export type CartLine = { slug: string; qty: number; name: string; price: number; image: string };
type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "alocmir-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* storage unavailable */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines, loaded]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    track("add_to_cart", { label: line.slug, value: line.price * qty, items: [{ id: line.slug, name: line.name, price: line.price, qty }] });
    setLines((cur) => {
      const found = cur.find((l) => l.slug === line.slug);
      if (found) return cur.map((l) => (l.slug === line.slug ? { ...l, qty: Math.min(48, l.qty + qty) } : l));
      return [...cur, { ...line, qty }];
    });
  }, []);
  const setQty = useCallback((slug: string, qty: number) => {
    setLines((cur) => (qty <= 0 ? cur.filter((l) => l.slug !== slug) : cur.map((l) => (l.slug === slug ? { ...l, qty: Math.min(48, qty) } : l))));
  }, []);
  const remove = useCallback((slug: string) => setLines((cur) => cur.filter((l) => l.slug !== slug)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(() => ({
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: Math.round(lines.reduce((s, l) => s + l.qty * l.price, 0) * 100) / 100,
    add, setQty, remove, clear,
  }), [lines, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart outside CartProvider");
  return v;
}
