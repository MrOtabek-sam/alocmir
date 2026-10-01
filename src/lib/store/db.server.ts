import { bindings } from "../bindings.server";
import type { Db as D1Database } from "../bindings.server";
import type { Lang } from "./i18n";

export type ProductRow = {
  id: number; slug: string; category: string; brand: string | null;
  name_en: string; name_ru: string | null; name_ar: string | null;
  desc_en: string | null; desc_ru: string | null; desc_ar: string | null;
  meta_title_en: string | null; meta_title_ru: string | null; meta_title_ar: string | null;
  meta_desc_en: string | null; meta_desc_ru: string | null; meta_desc_ar: string | null;
  price_aed: number; old_price_aed: number | null; volume_ml: number | null; abv: number | null;
  origin: string | null; image: string | null; stock: number; active: number; featured: number;
  created_at: string; updated_at: string;
};
export type CategoryRow = {
  slug: string; sort: number; image: string | null;
  name_en: string; name_ru: string | null; name_ar: string | null;
  intro_en: string | null; intro_ru: string | null; intro_ar: string | null;
};

export type Product = {
  id: number; slug: string; category: string; brand: string | null; name: string; description: string;
  metaTitle: string | null; metaDesc: string | null; price: number; oldPrice: number | null;
  volume: number | null; abv: number | null; origin: string | null; image: string; stock: number; featured: boolean;
  updatedAt: string;
};
export type Category = { slug: string; name: string; intro: string; image: string };
export type Settings = {
  delivery_fee: number; free_delivery_min: number; min_order: number;
  hours: string; whatsapp: string; phone: string; licence: string; delivery_eta: string;
};

export function db(): D1Database {
  const { DB } = bindings();
  if (!DB) throw new Error("Database is not configured");
  return DB;
}

function pick<T extends Record<string, unknown>>(row: T, base: string, lang: Lang): string | null {
  const v = row[`${base}_${lang}`] as string | null | undefined;
  if (v && String(v).trim()) return String(v);
  const en = row[`${base}_en`] as string | null | undefined;
  return en ? String(en) : null;
}

export function localizeProduct(r: ProductRow, lang: Lang): Product {
  return {
    id: r.id, slug: r.slug, category: r.category, brand: r.brand,
    name: pick(r, "name", lang) ?? r.name_en,
    description: pick(r, "desc", lang) ?? "",
    metaTitle: pick(r, "meta_title", lang), metaDesc: pick(r, "meta_desc", lang),
    price: r.price_aed, oldPrice: r.old_price_aed, volume: r.volume_ml, abv: r.abv, origin: r.origin,
    image: r.image || "/assets/products/whisky.jpg", stock: r.stock, featured: !!r.featured, updatedAt: r.updated_at,
  };
}
export function localizeCategory(r: CategoryRow, lang: Lang): Category {
  return {
    slug: r.slug, name: pick(r, "name", lang) ?? r.name_en, intro: pick(r, "intro", lang) ?? "",
    image: r.image || "/assets/products/whisky.jpg",
  };
}

export async function loadCategories(lang: Lang): Promise<Category[]> {
  const res = await db().prepare("SELECT * FROM categories ORDER BY sort, slug").all<CategoryRow>();
  return (res.results ?? []).map((r) => localizeCategory(r, lang));
}

export async function loadSettings(): Promise<Settings> {
  const res = await db().prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>();
  const m = new Map((res.results ?? []).map((r) => [r.key, r.value]));
  const num = (k: string, d: number) => {
    const n = Number(m.get(k));
    return Number.isFinite(n) ? n : d;
  };
  return {
    delivery_fee: num("delivery_fee", 25), free_delivery_min: num("free_delivery_min", 250),
    min_order: num("min_order", 0), hours: m.get("hours") ?? "", whatsapp: m.get("whatsapp") ?? "",
    phone: m.get("phone") ?? "", licence: m.get("licence") ?? "", delivery_eta: m.get("delivery_eta") ?? "45-60",
  };
}

export async function loadProducts(lang: Lang, opts: { category?: string; featured?: boolean; limit?: number } = {}) {
  const where = ["active = 1"];
  const args: unknown[] = [];
  if (opts.category) { where.push("category = ?"); args.push(opts.category); }
  if (opts.featured) where.push("featured = 1");
  const sql = `SELECT * FROM products WHERE ${where.join(" AND ")} ORDER BY featured DESC, (stock > 0) DESC, id DESC LIMIT ?`;
  args.push(opts.limit ?? 500);
  const res = await db().prepare(sql).bind(...args).all<ProductRow>();
  return (res.results ?? []).map((r) => localizeProduct(r, lang));
}

export async function loadProductRow(slug: string) {
  return db().prepare("SELECT * FROM products WHERE slug = ? AND active = 1").bind(slug).first<ProductRow>();
}

export type Promo = { code: string; kind: "percent" | "fixed"; value: number; min_subtotal: number; max_uses: number | null; uses: number; active: number; expires_at: string | null; note: string | null };

/** Returns the discount in AED for a code, or null when the code can't be used. */
export async function promoDiscount(code: string, subtotal: number): Promise<{ code: string; amount: number } | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const p = await db().prepare("SELECT * FROM promo_codes WHERE code = ? AND active = 1").bind(c).first<Promo>();
  if (!p) return null;
  if (p.expires_at && new Date(p.expires_at).getTime() < Date.now()) return null;
  if (p.max_uses != null && p.uses >= p.max_uses) return null;
  if (subtotal < p.min_subtotal) return null;
  const raw = p.kind === "fixed" ? p.value : (subtotal * p.value) / 100;
  return { code: c, amount: Math.min(subtotal, Math.round(raw * 100) / 100) };
}
