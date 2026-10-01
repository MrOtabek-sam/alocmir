import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { adminConfigured, checkPassword, clearSessionCookie, isAdminRequest, makeSessionCookie } from "./auth.server";
import { db, loadSettings, type CategoryRow, type ProductRow, type Promo } from "./db.server";
import type { PostRow } from "./blog.server";

async function requireAdmin() {
  if (!(await isAdminRequest(getRequest()))) throw new Error("unauthorized");
}

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => ({
  configured: adminConfigured(),
  loggedIn: await isAdminRequest(getRequest()),
}));

export const adminLogin = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    if (!adminConfigured()) return { ok: false as const, error: "not_configured" };
    if (!(await checkPassword(data.password))) return { ok: false as const, error: "wrong_password" };
    setResponseHeader("Set-Cookie", await makeSessionCookie());
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  setResponseHeader("Set-Cookie", clearSessionCookie());
  return { ok: true };
});

export const adminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const [products, categories, orders, settings, stats, leads, promos, posts] = await Promise.all([
    db().prepare("SELECT * FROM products ORDER BY id DESC").all<ProductRow>(),
    db().prepare("SELECT * FROM categories ORDER BY sort, slug").all<CategoryRow>(),
    db().prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 200").all<Record<string, unknown>>(),
    loadSettings(),
    db().prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS revenue,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS fresh FROM orders WHERE status != 'cancelled'`).first<{ n: number; revenue: number; fresh: number }>(),
    db().prepare("SELECT * FROM leads ORDER BY id DESC LIMIT 500").all<{ id: number; phone: string; lang: string; source: string; created_at: string }>(),
    db().prepare("SELECT * FROM promo_codes ORDER BY code").all<Promo>(),
    db().prepare("SELECT * FROM posts ORDER BY publish_at DESC").all<PostRow>().catch(() => ({ results: [] as PostRow[] })),
  ]);
  return {
    products: products.results ?? [], categories: categories.results ?? [],
    orders: (orders.results ?? []) as {
      id: number; code: string; name: string; phone: string; area: string; address: string; notes: string;
      items_json: string; subtotal: number; delivery_fee: number; total: number; payment: string; lang: string;
      status: string; created_at: string;
    }[],
    settings, stats: stats ?? { n: 0, revenue: 0, fresh: 0 },
    leads: leads.results ?? [], promos: promos.results ?? [], posts: posts.results ?? [],
  };
});

type Count = { k: string | null; n: number; v?: number };

export const adminAnalytics = createServerFn({ method: "GET" })
  .validator(z.object({ days: z.number().int().min(1).max(365) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const since = `-${data.days} days`;
    const W = "created_at >= datetime('now', ?)";
    // Dates are grouped by Dubai day (UTC+4).
    const day = "date(created_at, '+4 hours')";
    const q = <T,>(sql: string) => db().prepare(sql).bind(since).all<T>().then((r) => r.results ?? []).catch(() => [] as T[]);
    const group = (col: string, type = "pageview", metric = "COUNT(DISTINCT visitor)") =>
      q<Count>(`SELECT ${col} AS k, ${metric} AS n FROM events WHERE ${W} AND type = '${type}' GROUP BY k ORDER BY n DESC LIMIT 15`);

    const [totals, daily, pages, sources, sourceOrders, devices, countries, langs, waPlaces, funnel, orders, dailyOrders, leads] = await Promise.all([
      q<{ visitors: number; sessions: number; views: number; wa: number; waVisitors: number }>(`SELECT COUNT(DISTINCT visitor) AS visitors,
        COUNT(DISTINCT session) AS sessions, SUM(type = 'pageview') AS views, SUM(type = 'whatsapp_click') AS wa,
        COUNT(DISTINCT CASE WHEN type = 'whatsapp_click' THEN visitor END) AS waVisitors FROM events WHERE ${W}`),
      q<{ d: string; visitors: number; views: number }>(`SELECT ${day} AS d, COUNT(DISTINCT visitor) AS visitors, SUM(type = 'pageview') AS views
        FROM events WHERE ${W} GROUP BY d`),
      q<{ k: string; n: number; v: number }>(`SELECT path AS k, COUNT(*) AS n, COUNT(DISTINCT visitor) AS v FROM events
        WHERE ${W} AND type = 'pageview' GROUP BY k ORDER BY n DESC LIMIT 15`),
      group("source", "pageview", "COUNT(DISTINCT session)"),
      group("source", "order", "COUNT(*)"),
      group("device"),
      group("COALESCE(country, '—')"),
      group("lang"),
      group("COALESCE(label, 'link')", "whatsapp_click", "COUNT(*)"),
      q<{ visitors: number; product: number; cart: number; checkout: number; ordered: number; wa: number }>(`SELECT
        COUNT(DISTINCT visitor) AS visitors,
        COUNT(DISTINCT CASE WHEN type = 'pageview' AND path LIKE '%/product/%' THEN visitor END) AS product,
        COUNT(DISTINCT CASE WHEN type = 'add_to_cart' THEN visitor END) AS cart,
        COUNT(DISTINCT CASE WHEN type = 'pageview' AND path LIKE '%/cart' THEN visitor END) AS checkout,
        COUNT(DISTINCT CASE WHEN type = 'order' THEN visitor END) AS ordered,
        COUNT(DISTINCT CASE WHEN type = 'whatsapp_click' THEN visitor END) AS wa
        FROM events WHERE ${W}`),
      q<{ total: number; area: string; payment: string; lang: string; promo_code: string | null; items_json: string }>(
        `SELECT total, area, payment, lang, promo_code, items_json FROM orders WHERE ${W} AND status != 'cancelled'`),
      q<{ d: string; orders: number; revenue: number }>(`SELECT ${day} AS d, COUNT(*) AS orders, SUM(total) AS revenue
        FROM orders WHERE ${W} AND status != 'cancelled' GROUP BY d`),
      q<{ n: number }>(`SELECT COUNT(*) AS n FROM leads WHERE ${W}`),
    ]);

    // One row per day, including days with no activity, so the charts have no gaps.
    const byDay = new Map(daily.map((d) => [d.d, d]));
    const ordersByDay = new Map(dailyOrders.map((d) => [d.d, d]));
    const days = Array.from({ length: data.days }, (_, i) => {
      const d = new Date(Date.now() + 4 * 3600_000 - (data.days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
      return {
        d, visitors: byDay.get(d)?.visitors ?? 0, views: byDay.get(d)?.views ?? 0,
        orders: ordersByDay.get(d)?.orders ?? 0, revenue: Math.round(ordersByDay.get(d)?.revenue ?? 0),
      };
    });

    const products = new Map<string, { qty: number; revenue: number }>();
    const tally = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    const areas = new Map<string, number>();
    const payments = new Map<string, number>();
    const promos = new Map<string, number>();
    for (const o of orders) {
      tally(areas, o.area);
      tally(payments, o.payment);
      if (o.promo_code) tally(promos, o.promo_code);
      for (const l of JSON.parse(o.items_json) as { name: string; qty: number; line: number }[]) {
        const p = products.get(l.name) ?? { qty: 0, revenue: 0 };
        products.set(l.name, { qty: p.qty + l.qty, revenue: p.revenue + l.line });
      }
    }
    const sorted = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ k, n }));
    const revenue = Math.round(orders.reduce((s, o) => s + o.total, 0));
    const t = totals[0] ?? { visitors: 0, sessions: 0, views: 0, wa: 0, waVisitors: 0 };
    const ordersBySource = new Map(sourceOrders.map((s) => [s.k, s.n]));

    return {
      totals: {
        visitors: t.visitors, sessions: t.sessions, views: t.views ?? 0, whatsapp: t.wa ?? 0, whatsappVisitors: t.waVisitors ?? 0,
        orders: orders.length, revenue, aov: orders.length ? Math.round(revenue / orders.length) : 0, leads: leads[0]?.n ?? 0,
      },
      days,
      funnel: funnel[0] ?? { visitors: 0, product: 0, cart: 0, checkout: 0, ordered: 0, wa: 0 },
      pages, devices, countries, langs, waPlaces,
      sources: sources.map((s) => ({ ...s, orders: ordersBySource.get(s.k) ?? 0 })),
      products: [...products].map(([name, p]) => ({ name, ...p })).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      areas: sorted(areas), payments: sorted(payments), promos: sorted(promos),
    };
  });

const short = z.string().max(5000).nullable().optional();
const text = z.string().max(40000).nullable().optional();
const postSchema = z.object({
  id: z.number().int().nullable(),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  cover: z.string().max(500).nullable(),
  publish_at: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
  active: z.boolean(),
  products: z.string().max(2000).nullable(),
  title_ru: short, title_en: short, excerpt_ru: short, excerpt_en: short, body_ru: text, body_en: text,
  meta_title_ru: short, meta_title_en: short, meta_desc_ru: short, meta_desc_en: short,
}).refine((p) => (p.title_ru && p.body_ru) || (p.title_en && p.body_en), { message: "needs_one_language" });
const POST_FIELDS = ["slug", "cover", "publish_at", "active", "products", "title_ru", "title_en", "excerpt_ru", "excerpt_en",
  "body_ru", "body_en", "meta_title_ru", "meta_title_en", "meta_desc_ru", "meta_desc_en"] as const;

export const adminSavePost = createServerFn({ method: "POST" })
  .validator(postSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const vals = POST_FIELDS.map((f) => {
      const v = (data as Record<string, unknown>)[f];
      if (typeof v === "boolean") return v ? 1 : 0;
      if (v === undefined || v === "") return null;
      return v;
    });
    try {
      if (data.id) {
        await db().prepare(`UPDATE posts SET ${POST_FIELDS.map((f) => `${f} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`)
          .bind(...vals, data.id).run();
        return { ok: true as const, id: data.id };
      }
      const r = await db().prepare(`INSERT INTO posts (${POST_FIELDS.join(", ")}) VALUES (${POST_FIELDS.map(() => "?").join(", ")})`)
        .bind(...vals).run();
      return { ok: true as const, id: Number(r.meta.last_row_id) };
    } catch (e) {
      return { ok: false as const, error: String(e).includes("UNIQUE") ? "slug_taken" : "save_failed" };
    }
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db().prepare("DELETE FROM posts WHERE id = ?").bind(data.id).run();
    return { ok: true };
  });

const opt = z.string().max(5000).nullable().optional();
const productSchema = z.object({
  id: z.number().int().nullable(),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().min(1).max(80),
  brand: opt,
  name_en: z.string().trim().min(1).max(200), name_ru: opt, name_ar: opt,
  desc_en: opt, desc_ru: opt, desc_ar: opt,
  meta_title_en: opt, meta_title_ru: opt, meta_title_ar: opt,
  meta_desc_en: opt, meta_desc_ru: opt, meta_desc_ar: opt,
  price_aed: z.number().min(0).max(1000000), old_price_aed: z.number().min(0).nullable(),
  volume_ml: z.number().int().min(0).nullable(), abv: z.number().min(0).max(100).nullable(),
  origin: opt, image: z.string().max(500).nullable(),
  stock: z.number().int().min(0).max(1000000), active: z.boolean(), featured: z.boolean(),
});
const FIELDS = ["slug","category","brand","name_en","name_ru","name_ar","desc_en","desc_ru","desc_ar",
  "meta_title_en","meta_title_ru","meta_title_ar","meta_desc_en","meta_desc_ru","meta_desc_ar",
  "price_aed","old_price_aed","volume_ml","abv","origin","image","stock","active","featured"] as const;

export const adminSaveProduct = createServerFn({ method: "POST" })
  .validator(productSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const vals = FIELDS.map((f) => {
      const v = (data as Record<string, unknown>)[f];
      if (typeof v === "boolean") return v ? 1 : 0;
      if (v === undefined || v === "") return null;
      return v;
    });
    try {
      if (data.id) {
        await db().prepare(`UPDATE products SET ${FIELDS.map((f) => `${f} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`)
          .bind(...vals, data.id).run();
        return { ok: true as const, id: data.id };
      }
      const r = await db().prepare(`INSERT INTO products (${FIELDS.join(", ")}) VALUES (${FIELDS.map(() => "?").join(", ")})`)
        .bind(...vals).run();
      return { ok: true as const, id: Number(r.meta.last_row_id) };
    } catch (e) {
      return { ok: false as const, error: String(e).includes("UNIQUE") ? "slug_taken" : "save_failed" };
    }
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db().prepare("DELETE FROM products WHERE id = ?").bind(data.id).run();
    return { ok: true };
  });

export const adminSetOrderStatus = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int(), status: z.enum(["new", "confirmed", "out_for_delivery", "delivered", "cancelled"]) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db().prepare("UPDATE orders SET status = ? WHERE id = ?").bind(data.status, data.id).run();
    return { ok: true };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .validator(z.object({
    delivery_fee: z.number().min(0), free_delivery_min: z.number().min(0), min_order: z.number().min(0),
    hours: z.string().max(100), whatsapp: z.string().max(40), phone: z.string().max(40), licence: z.string().max(400),
    delivery_eta: z.string().max(20),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db().batch(Object.entries(data).map(([k, v]) =>
      db().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(k, String(v))));
    return { ok: true };
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .validator(z.object({
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), sort: z.number().int(),
    image: z.string().max(500).nullable(), name_en: z.string().min(1).max(120), name_ru: opt, name_ar: opt,
    intro_en: opt, intro_ru: opt, intro_ar: opt,
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db().prepare(`INSERT INTO categories (slug, sort, image, name_en, name_ru, name_ar, intro_en, intro_ru, intro_ar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET sort = excluded.sort, image = excluded.image,
      name_en = excluded.name_en, name_ru = excluded.name_ru, name_ar = excluded.name_ar,
      intro_en = excluded.intro_en, intro_ru = excluded.intro_ru, intro_ar = excluded.intro_ar`)
      .bind(data.slug, data.sort, data.image, data.name_en, data.name_ru ?? null, data.name_ar ?? null,
        data.intro_en ?? null, data.intro_ru ?? null, data.intro_ar ?? null).run();
    return { ok: true };
  });

export const adminSavePromo = createServerFn({ method: "POST" })
  .validator(z.object({
    code: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/), kind: z.enum(["percent", "fixed"]), value: z.number().min(0),
    min_subtotal: z.number().min(0), max_uses: z.number().int().min(1).nullable(), active: z.boolean(),
    expires_at: z.string().max(30).nullable(), note: z.string().max(200).nullable(),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db().prepare(`INSERT INTO promo_codes (code, kind, value, min_subtotal, max_uses, active, expires_at, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET kind = excluded.kind, value = excluded.value, min_subtotal = excluded.min_subtotal,
      max_uses = excluded.max_uses, active = excluded.active, expires_at = excluded.expires_at, note = excluded.note`)
      .bind(data.code.toUpperCase(), data.kind, data.value, data.min_subtotal, data.max_uses, data.active ? 1 : 0, data.expires_at, data.note).run();
    return { ok: true };
  });
