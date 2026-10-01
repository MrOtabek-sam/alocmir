import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";

import { LANGS, type Lang } from "./i18n";
import { loadPost, loadPosts, localizePost } from "./blog.server";
import {
  db, loadCategories, loadProductRow, loadProducts, loadSettings, localizeProduct, promoDiscount, type ProductRow,
} from "./db.server";
import { leadMessage, notifyTelegram, orderMessage } from "./notify.server";

const langSchema = z.enum(LANGS);

export const getHomeData = createServerFn({ method: "GET" })
  .validator(z.object({ lang: langSchema }))
  .handler(async ({ data }) => {
    const [categories, featured, packs, settings, posts] = await Promise.all([
      loadCategories(data.lang), loadProducts(data.lang, { featured: true, limit: 12 }),
      loadProducts(data.lang, { category: "packs", limit: 6 }), loadSettings(),
      // The home page must not break if the blog migration hasn't been run on this database yet.
      loadPosts(data.lang, 3).catch(() => []),
    ]);
    return { categories, featured: featured.filter((p) => p.category !== "packs"), packs, settings, posts };
  });

async function productsBySlugs(lang: Lang, slugs: string[]) {
  if (!slugs.length) return [];
  const q = slugs.map(() => "?").join(",");
  const res = await db().prepare(`SELECT * FROM products WHERE active = 1 AND slug IN (${q})`).bind(...slugs).all<ProductRow>();
  const bySlug = new Map((res.results ?? []).map((r) => [r.slug, localizeProduct(r, lang)]));
  return slugs.flatMap((s) => bySlug.get(s) ?? []);
}

export const getBlog = createServerFn({ method: "GET" })
  .validator(z.object({ lang: langSchema }))
  .handler(async ({ data }) => ({ posts: await loadPosts(data.lang) }));

export const getBlogPost = createServerFn({ method: "GET" })
  .validator(z.object({ lang: langSchema, slug: z.string().max(140) }))
  .handler(async ({ data }) => {
    const row = await loadPost(data.slug);
    if (!row) throw notFound();
    const post = localizePost(row, data.lang);
    // The post exists, just not in this language (e.g. after switching language).
    if (!post) return { missing: true as const };
    const [products, recent] = await Promise.all([productsBySlugs(data.lang, post.products), loadPosts(data.lang, 4)]);
    return { missing: false as const, post, products, related: recent.filter((p) => p.slug !== post.slug).slice(0, 3) };
  });

export const getCatalog = createServerFn({ method: "GET" })
  .validator(z.object({ lang: langSchema, category: z.string().max(80).optional() }))
  .handler(async ({ data }) => {
    const categories = await loadCategories(data.lang);
    const category = data.category ? categories.find((c) => c.slug === data.category) : undefined;
    if (data.category && !category) throw notFound();
    const products = await loadProducts(data.lang, { category: data.category });
    return { categories, category: category ?? null, products };
  });

export const getProduct = createServerFn({ method: "GET" })
  .validator(z.object({ lang: langSchema, slug: z.string().max(120) }))
  .handler(async ({ data }) => {
    const row = await loadProductRow(data.slug);
    if (!row) throw notFound();
    const product = localizeProduct(row, data.lang);
    const [categories, related] = await Promise.all([
      loadCategories(data.lang), loadProducts(data.lang, { category: row.category, limit: 5 }),
    ]);
    return {
      product,
      category: categories.find((c) => c.slug === row.category) ?? null,
      related: related.filter((p) => p.slug !== product.slug).slice(0, 4),
    };
  });

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => loadSettings());

export const getProductsBySlugs = createServerFn({ method: "POST" })
  .validator(z.object({ lang: langSchema, slugs: z.array(z.string().max(120)).max(60) }))
  .handler(async ({ data }) => {
    if (!data.slugs.length) return [];
    const q = data.slugs.map(() => "?").join(",");
    const res = await db().prepare(`SELECT * FROM products WHERE active = 1 AND slug IN (${q})`).bind(...data.slugs).all();
    return ((res.results ?? []) as Parameters<typeof localizeProduct>[0][]).map((r) => localizeProduct(r, data.lang));
  });

const orderSchema = z.object({
  lang: langSchema,
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  area: z.string().trim().min(2).max(80),
  address: z.string().trim().min(3).max(300),
  notes: z.string().trim().max(500).optional().default(""),
  payment: z.enum(["cash", "card"]),
  ageOk: z.literal(true),
  items: z.array(z.object({ slug: z.string().max(120), qty: z.number().int().min(1).max(48) })).min(1).max(60),
  promo: z.string().max(40).optional().default(""),
});

export const placeOrder = createServerFn({ method: "POST" })
  .validator(orderSchema)
  .handler(async ({ data }) => {
    const slugs = data.items.map((i) => i.slug);
    const q = slugs.map(() => "?").join(",");
    const res = await db().prepare(`SELECT slug, name_en, price_aed, stock FROM products WHERE active = 1 AND slug IN (${q})`)
      .bind(...slugs).all<{ slug: string; name_en: string; price_aed: number; stock: number }>();
    const bySlug = new Map((res.results ?? []).map((r) => [r.slug, r]));
    const lines = data.items.flatMap((i) => {
      const p = bySlug.get(i.slug);
      if (!p || p.stock <= 0) return [];
      const qty = Math.min(i.qty, p.stock);
      return [{ slug: p.slug, name: p.name_en, qty, price: p.price_aed, line: Math.round(p.price_aed * qty * 100) / 100 }];
    });
    if (!lines.length) return { ok: false as const, error: "empty" };
    const settings = await loadSettings();
    const subtotal = Math.round(lines.reduce((s, l) => s + l.line, 0) * 100) / 100;
    if (subtotal < settings.min_order) return { ok: false as const, error: "min_order", min: settings.min_order };
    const fee = subtotal >= settings.free_delivery_min ? 0 : settings.delivery_fee;
    const promo = data.promo ? await promoDiscount(data.promo, subtotal) : null;
    const discount = promo?.amount ?? 0;
    const total = Math.round((subtotal - discount + fee) * 100) / 100;
    const rand = new Uint32Array(1);
    crypto.getRandomValues(rand);
    const code = `AL-${String(rand[0] % 1000000).padStart(6, "0")}`;
    const stmts = [
      db().prepare(`INSERT INTO orders (code, name, phone, area, address, notes, items_json, subtotal, delivery_fee, total, payment, lang, discount, promo_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(code, data.name, data.phone, data.area, data.address, data.notes ?? "", JSON.stringify(lines), subtotal, fee, total, data.payment, data.lang, discount, promo?.code ?? null),
      ...(promo ? [db().prepare("UPDATE promo_codes SET uses = uses + 1 WHERE code = ?").bind(promo.code)] : []),
      ...lines.map((l) => db().prepare("UPDATE products SET stock = MAX(stock - ?, 0) WHERE slug = ?").bind(l.qty, l.slug)),
    ];
    await db().batch(stmts);
    await notifyTelegram(orderMessage({
      code, name: data.name, phone: data.phone, area: data.area, address: data.address, notes: data.notes ?? "",
      payment: data.payment, lang: data.lang, lines, subtotal, discount, promo: promo?.code ?? null, fee, total,
    }));
    return { ok: true as const, code, total };
  });

export const getChrome = createServerFn({ method: "GET" })
  .validator(z.object({ lang: langSchema }))
  .handler(async ({ data }) => {
    try {
      const [settings, categories] = await Promise.all([loadSettings(), loadCategories(data.lang)]);
      return { settings, categories: categories.map((c) => ({ slug: c.slug, name: c.name })) };
    } catch {
      return { settings: null, categories: [] as { slug: string; name: string }[] };
    }
  });

export const checkPromo = createServerFn({ method: "POST" })
  .validator(z.object({ code: z.string().max(40), subtotal: z.number().min(0) }))
  .handler(async ({ data }) => {
    const r = await promoDiscount(data.code, data.subtotal);
    return r ? { ok: true as const, ...r } : { ok: false as const };
  });

export const saveLead = createServerFn({ method: "POST" })
  .validator(z.object({ phone: z.string().trim().min(6).max(40), lang: langSchema, source: z.string().max(40).default("popup") }))
  .handler(async ({ data }) => {
    await db().prepare("INSERT INTO leads (phone, lang, source) VALUES (?, ?, ?)").bind(data.phone, data.lang, data.source).run();
    await notifyTelegram(leadMessage(data.phone, data.source, data.lang));
    return { ok: true, code: "WELCOME10" };
  });

export const getUpsell = createServerFn({ method: "GET" })
  .validator(z.object({ lang: langSchema }))
  .handler(async ({ data }) => loadProducts(data.lang, { category: "mixers", limit: 6 }));
