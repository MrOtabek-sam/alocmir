import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { Analytics } from "@/components/admin/analytics";
import { PostForm } from "@/components/admin/post-form";
import { ProductForm } from "@/components/admin/product-form";
import {
  adminDashboard, adminLogin, adminLogout, adminSaveCategory, adminSavePromo, adminSaveSettings, adminSetOrderStatus, adminStatus,
} from "@/lib/store/admin.functions";
import type { CategoryRow, ProductRow } from "@/lib/store/db.server";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin | Alcomir" }, { name: "robots", content: "noindex, nofollow" }] }),
  loader: async () => {
    const status = await adminStatus();
    if (!status.loggedIn) return { status, data: null };
    return { status, data: await adminDashboard() };
  },
  component: AdminRoute,
});

const input = "h-10 w-full rounded-[8px] border border-line-strong bg-surface px-3 text-fs14 text-ink";
const STATUSES = ["new", "confirmed", "out_for_delivery", "delivered", "cancelled"] as const;

function Login({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pw = String(new FormData(e.currentTarget).get("password") ?? "");
    const r = await adminLogin({ data: { password: pw } });
    if (r.ok) router.invalidate();
    else setErr(r.error === "not_configured" ? "Admin password is not set yet." : "Wrong password.");
  }
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-[380px] space-y-4 rounded-[16px] border border-line bg-raised p-8">
        <img src="/assets/brand/mark.png" alt="" role="presentation" width={44} height={44} className="size-11 rounded-[10px]" />
        <h1 className="text-fs24 font-bold text-ink">Alcomir admin</h1>
        {!configured ? (
          <p className="text-fs14 leading-relaxed text-warn">
            Set the ADMIN_PASSWORD environment variable (8+ characters) in your Vercel project settings, then redeploy.
          </p>
        ) : null}
        <label className="flex flex-col gap-1.5 text-fs14 font-semibold text-ink">
          Password
          <input name="password" type="password" required autoComplete="current-password" className={input} aria-describedby={err ? "login-err" : undefined} />
        </label>
        {err ? <p id="login-err" role="alert" className="text-fs14 text-bad">{err}</p> : null}
        <button type="submit" className="h-11 w-full rounded-[10px] bg-gold font-semibold text-ongold">Sign in</button>
      </form>
    </main>
  );
}

type Dash = NonNullable<Awaited<ReturnType<typeof adminDashboard>>>;

function Orders({ orders }: { orders: Dash["orders"] }) {
  const router = useRouter();
  if (!orders.length) return <p className="text-muted">No orders yet.</p>;
  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const items = JSON.parse(o.items_json) as { name: string; qty: number; line: number }[];
        return (
          <article key={o.id} className="rounded-[12px] border border-line bg-raised p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="alc-tabular text-fs16 font-bold text-ink">{o.code} · AED {o.total}{(o as { promo_code?: string }).promo_code ? ` · ${(o as { promo_code?: string }).promo_code}` : ""}</p>
                <p className="text-fs13 text-muted">{o.created_at} UTC · {o.lang.toUpperCase()} · {o.payment}</p>
              </div>
              <select aria-label={`Status of ${o.code}`} value={o.status}
                onChange={async (e) => { await adminSetOrderStatus({ data: { id: o.id, status: e.target.value as (typeof STATUSES)[number] } }); router.invalidate(); }}
                className="h-9 rounded-[8px] border border-line-strong bg-surface px-2 text-fs13 text-ink">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="mt-3 grid gap-3 text-fs14 md:grid-cols-2">
              <div className="text-ink">
                <p className="font-semibold">{o.name}</p>
                <p><a className="alc-tabular text-link" href={`tel:${o.phone}`}>{o.phone}</a> · <a className="text-link" href={`https://wa.me/${o.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener">WhatsApp</a></p>
                <p className="text-muted">{o.area}, {o.address}</p>
                {o.notes ? <p className="text-muted">Note: {o.notes}</p> : null}
              </div>
              <ul className="text-muted">
                {items.map((i) => <li key={i.name}>{i.qty} x {i.name} <span className="alc-tabular">(AED {i.line})</span></li>)}
                <li className="mt-1 text-ink">Delivery: AED {o.delivery_fee}</li>
              </ul>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Products({ products, categories }: { products: ProductRow[]; categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const [q, setQ] = useState("");
  const list = products.filter((p) => !q || `${p.name_en} ${p.slug} ${p.category}`.toLowerCase().includes(q.toLowerCase()));
  if (editing) {
    return <ProductForm product={editing === "new" ? null : editing} categories={categories} onDone={() => { setEditing(null); router.invalidate(); }} />;
  }
  return (
    <div>
      <div className="mb-4 flex gap-3">
        <input aria-label="Search products" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} className={input} />
        <button type="button" onClick={() => setEditing("new")} className="h-10 shrink-0 rounded-[8px] bg-gold px-4 text-fs14 font-semibold text-ongold">+ Add product</button>
      </div>
      <div className="overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full text-fs14">
          <thead className="bg-raised text-start text-fs12 text-muted">
            <tr><th className="p-3 text-start">Product</th><th className="p-3 text-start">Category</th><th className="p-3 text-end">Price</th><th className="p-3 text-end">Stock</th><th className="p-3 text-start">Status</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="p-3"><div className="flex items-center gap-3"><img src={p.image ?? ""} alt="" className="size-10 rounded-[6px] object-cover" /><span className="text-ink">{p.name_en}</span></div></td>
                <td className="p-3 text-muted">{p.category}</td>
                <td className="alc-tabular p-3 text-end text-ink">{p.price_aed}</td>
                <td className={`alc-tabular p-3 text-end ${p.stock <= 0 ? "text-bad" : p.stock <= 5 ? "text-warn" : "text-ink"}`}>{p.stock}</td>
                <td className="p-3 text-muted">{p.active ? "Visible" : "Hidden"}{p.featured ? " · Best seller" : ""}</td>
                <td className="p-3 text-end"><button type="button" onClick={() => setEditing(p)} className="font-semibold text-link">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Categories({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return (
    <div className="space-y-4">
      <p className="text-fs14 text-muted">The intro text appears at the top of each category page and is the main SEO text for it.</p>
      {categories.map((c) => (
        <form key={c.slug} className="grid gap-3 rounded-[12px] border border-line bg-raised p-4 md:grid-cols-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const g = (k: string) => String(f.get(k) ?? "") || null;
            await adminSaveCategory({ data: { slug: c.slug, sort: Number(f.get("sort") ?? c.sort), image: g("image"), name_en: g("name_en") ?? c.name_en,
              name_ru: g("name_ru"), intro_en: g("intro_en"), intro_ru: g("intro_ru") } });
            setMsg(`Saved ${c.slug}`);
            router.invalidate();
          }}>
          {(["en", "ru"] as const).map((l) => (
            <div key={l} className="space-y-2">
              <input aria-label={`Name ${l}`} name={`name_${l}`} defaultValue={(c as Record<string, unknown>)[`name_${l}`] as string ?? ""} className={input} />
              <textarea aria-label={`Intro ${l}`} name={`intro_${l}`} rows={4} defaultValue={(c as Record<string, unknown>)[`intro_${l}`] as string ?? ""} className="w-full rounded-[8px] border border-line-strong bg-surface p-2 text-fs13 text-ink" />
            </div>
          ))}
          <div className="flex items-center gap-3 md:col-span-3">
            <label className="text-fs13 text-muted">Order <input name="sort" type="number" defaultValue={c.sort} className="ms-1 h-9 w-20 rounded-[8px] border border-line-strong bg-surface px-2 text-ink" /></label>
            <label className="flex-1 text-fs13 text-muted">Image URL <input name="image" defaultValue={c.image ?? ""} className="ms-1 h-9 w-full rounded-[8px] border border-line-strong bg-surface px-2 text-ink" /></label>
            <button type="submit" className="h-9 rounded-[8px] bg-gold px-4 text-fs13 font-semibold text-ongold">Save {c.slug}</button>
          </div>
        </form>
      ))}
      {msg ? <p role="status" className="text-ok">{msg}</p> : null}
    </div>
  );
}

function SettingsForm({ settings }: { settings: Dash["settings"] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return (
    <form className="grid max-w-[640px] gap-4" onSubmit={async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const n = (k: string) => Number(f.get(k) ?? 0);
      const s = (k: string) => String(f.get(k) ?? "");
      await adminSaveSettings({ data: { delivery_fee: n("delivery_fee"), free_delivery_min: n("free_delivery_min"), min_order: n("min_order"),
        hours: s("hours"), whatsapp: s("whatsapp"), phone: s("phone"), licence: s("licence"), delivery_eta: s("delivery_eta") } });
      setMsg("Settings saved.");
      router.invalidate();
    }}>
      {([
        ["delivery_fee", "Delivery fee (AED)", "number"], ["free_delivery_min", "Free delivery from (AED)", "number"],
        ["min_order", "Minimum order (AED)", "number"], ["hours", "Delivery hours", "text"],
        ["whatsapp", "WhatsApp number (with country code)", "tel"], ["phone", "Phone number", "tel"],
        ["delivery_eta", "Delivery time in minutes (e.g. 45-60)", "text"],
      ] as const).map(([k, label, type]) => (
        <label key={k} className="flex flex-col gap-1 text-fs13 font-semibold text-muted">{label}
          <input name={k} type={type} step="0.01" defaultValue={String(settings[k])} className={input} />
        </label>
      ))}
      <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">Licence line (footer)
        <textarea name="licence" rows={2} defaultValue={settings.licence} className="rounded-[8px] border border-line-strong bg-surface p-2 text-fs14 text-ink" />
      </label>
      <button type="submit" className="h-11 w-fit rounded-[10px] bg-gold px-6 font-semibold text-ongold">Save settings</button>
      {msg ? <p role="status" className="text-ok">{msg}</p> : null}
    </form>
  );
}

function Leads({ leads }: { leads: Dash["leads"] }) {
  const csv = "phone,lang,source,created_at\n" + leads.map((l) => `${l.phone},${l.lang},${l.source},${l.created_at}`).join("\n");
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-fs14 text-muted">{leads.length} WhatsApp numbers from the 10% popup. Message them new offers and restocks.</p>
        <a download="alcomir-leads.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} className="h-9 rounded-[8px] border border-gold px-4 py-2 text-fs13 font-semibold text-gold">Download CSV</a>
      </div>
      <ul className="divide-y divide-line rounded-[12px] border border-line">
        {leads.map((l) => (
          <li key={l.id} className="flex items-center justify-between p-3 text-fs14">
            <a className="alc-tabular text-link" href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener">{l.phone}</a>
            <span className="text-muted">{l.lang.toUpperCase()} · {l.created_at}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Promos({ promos }: { promos: Dash["promos"] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return (
    <div className="space-y-6">
      <form className="grid gap-3 rounded-[12px] border border-line bg-raised p-4 md:grid-cols-4" onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const g = (k: string) => String(f.get(k) ?? "");
        await adminSavePromo({ data: { code: g("code"), kind: g("kind") === "fixed" ? "fixed" : "percent", value: Number(g("value")),
          min_subtotal: Number(g("min_subtotal") || 0), max_uses: g("max_uses") ? Number(g("max_uses")) : null, active: f.get("active") === "on",
          expires_at: g("expires_at") || null, note: g("note") || null } });
        setMsg("Promo code saved.");
        router.invalidate();
      }}>
        <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">Code<input name="code" required className={input} placeholder="BRUNCH15" /></label>
        <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">Type<select name="kind" className={input}><option value="percent">% off</option><option value="fixed">AED off</option></select></label>
        <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">Value<input name="value" type="number" step="0.01" required className={input} /></label>
        <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">Min. order (AED)<input name="min_subtotal" type="number" className={input} /></label>
        <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">Max uses<input name="max_uses" type="number" className={input} /></label>
        <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">Expires<input name="expires_at" type="date" className={input} /></label>
        <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">Note<input name="note" className={input} /></label>
        <div className="flex items-end gap-3"><label className="flex items-center gap-2 text-fs14 text-ink"><input name="active" type="checkbox" defaultChecked /> Active</label>
          <button type="submit" className="h-10 rounded-[8px] bg-gold px-4 text-fs14 font-semibold text-ongold">Save code</button></div>
      </form>
      {msg ? <p role="status" className="text-ok">{msg}</p> : null}
      <table className="w-full text-fs14">
        <thead className="text-fs12 text-muted"><tr><th className="p-2 text-start">Code</th><th className="p-2 text-start">Discount</th><th className="p-2 text-start">Min</th><th className="p-2 text-start">Used</th><th className="p-2 text-start">Status</th></tr></thead>
        <tbody className="divide-y divide-line">
          {promos.map((p) => (
            <tr key={p.code}><td className="p-2 font-semibold text-gold">{p.code}</td><td className="p-2 text-ink">{p.kind === "percent" ? `${p.value}%` : `AED ${p.value}`}</td>
              <td className="p-2 text-muted">AED {p.min_subtotal}</td><td className="alc-tabular p-2 text-ink">{p.uses}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
              <td className="p-2 text-muted">{p.active ? "Active" : "Off"}{p.expires_at ? ` · until ${p.expires_at}` : ""}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Blog({ posts, productSlugs }: { posts: Dash["posts"]; productSlugs: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Dash["posts"][number] | "new" | null>(null);
  if (editing) {
    return <PostForm post={editing === "new" ? null : editing} productSlugs={productSlugs} onDone={() => { setEditing(null); router.invalidate(); }} />;
  }
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const dubai = (utc: string) => new Date(new Date(`${utc.replace(" ", "T")}Z`).getTime() + 4 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ");
  const live = posts.filter((p) => p.active && p.publish_at <= now).length;
  const scheduled = posts.filter((p) => p.active && p.publish_at > now).length;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-fs14 text-muted">{live} live · {scheduled} scheduled. Scheduled posts go live on their date automatically (Dubai time).</p>
        <button type="button" onClick={() => setEditing("new")} className="h-10 shrink-0 rounded-[8px] bg-gold px-4 text-fs14 font-semibold text-ongold">+ New post</button>
      </div>
      <div className="overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full text-fs14">
          <thead className="bg-raised text-fs12 text-muted">
            <tr><th className="p-3 text-start">Post</th><th className="p-3 text-start">Languages</th><th className="p-3 text-start">Publish (Dubai)</th><th className="p-3 text-start">Status</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {posts.map((p) => {
              const status = !p.active ? ["Hidden", "text-muted"] : p.publish_at <= now ? ["Live", "text-ok"] : ["Scheduled", "text-warn"];
              return (
                <tr key={p.id}>
                  <td className="p-3"><div className="flex items-center gap-3"><img src={p.cover ?? ""} alt="" className="h-10 w-16 rounded-[6px] object-cover" /><span className="text-ink">{p.title_ru || p.title_en}</span></div></td>
                  <td className="p-3 text-muted">{[p.title_ru && p.body_ru ? "RU" : "", p.title_en && p.body_en ? "EN" : ""].filter(Boolean).join(" + ")}</td>
                  <td className="alc-tabular p-3 text-muted">{dubai(p.publish_at)}</td>
                  <td className={`p-3 font-semibold ${status[1]}`}>{status[0]}</td>
                  <td className="p-3 text-end"><button type="button" onClick={() => setEditing(p)} className="font-semibold text-link">Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRoute() {
  const { status, data } = Route.useLoaderData();
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "analytics" | "products" | "blog" | "promos" | "leads" | "categories" | "settings">("orders");
  if (!status.loggedIn || !data) return <Login configured={status.configured} />;
  return (
    <main className="mx-auto min-h-dvh max-w-[1200px] px-4 py-8 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/assets/brand/mark.png" alt="" role="presentation" width={36} height={36} className="size-9 rounded-[8px]" />
          <h1 className="text-fs22 font-bold text-ink">Alcomir admin</h1>
        </div>
        <div className="flex items-center gap-4 text-fs14">
          <a href="/" target="_blank" rel="noopener" className="text-link">View site</a>
          <button type="button" onClick={async () => { await adminLogout(); router.invalidate(); }} className="text-muted hover:text-ink">Sign out</button>
        </div>
      </header>
      {!data.settings.whatsapp.replace(/[^0-9]/g, "") ? (
        <p role="alert" className="mt-6 rounded-[12px] border border-warn/50 bg-tint px-4 py-3 text-fs14 text-ink">
          <strong className="text-warn">WhatsApp number is not set</strong>, so the floating "Order on WhatsApp" button and all WhatsApp links are hidden on the site.{" "}
          <button type="button" onClick={() => setTab("settings")} className="font-semibold text-link underline">Add it in Settings</button> (with country code, e.g. +971 50 123 4567).
        </p>
      ) : null}
      <dl className="mt-6 grid grid-cols-3 gap-3">
        {[["New orders", data.stats.fresh], ["All orders", data.stats.n], ["Revenue (AED)", Math.round(data.stats.revenue)]].map(([k, v]) => (
          <div key={k} className="rounded-[12px] border border-line bg-raised p-4"><dt className="text-fs12 text-muted">{k}</dt><dd className="alc-tabular mt-1 text-fs24 font-bold text-ink">{v}</dd></div>
        ))}
      </dl>
      <nav role="tablist" className="mt-8 flex gap-1 border-b border-line">
        {(["orders", "analytics", "products", "blog", "promos", "leads", "categories", "settings"] as const).map((t) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-fs14 font-semibold capitalize ${tab === t ? "border-b-2 border-gold text-ink" : "text-muted hover:text-ink"}`}>{t}</button>
        ))}
      </nav>
      <section className="mt-6">
        {tab === "orders" ? <Orders orders={data.orders} /> : null}
        {tab === "analytics" ? <Analytics /> : null}
        {tab === "products" ? <Products products={data.products} categories={data.categories} /> : null}
        {tab === "blog" ? <Blog posts={data.posts} productSlugs={data.products.map((p) => p.slug)} /> : null}
        {tab === "promos" ? <Promos promos={data.promos} /> : null}
        {tab === "leads" ? <Leads leads={data.leads} /> : null}
        {tab === "categories" ? <Categories categories={data.categories} /> : null}
        {tab === "settings" ? <SettingsForm settings={data.settings} /> : null}
      </section>
    </main>
  );
}
