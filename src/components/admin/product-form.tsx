import { useState, type FormEvent } from "react";

import { adminDeleteProduct, adminSaveProduct } from "@/lib/store/admin.functions";
import type { CategoryRow, ProductRow } from "@/lib/store/db.server";

const input = "h-10 w-full rounded-[8px] border border-line-strong bg-surface px-3 text-fs14 text-ink";
const area = "w-full rounded-[8px] border border-line-strong bg-surface px-3 py-2 text-fs14 text-ink";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

function L({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">
      {label}
      {children}
      {hint ? <span className="font-normal">{hint}</span> : null}
    </label>
  );
}

export function ProductForm({ product, categories, onDone }: { product: ProductRow | null; categories: CategoryRow[]; onDone: () => void }) {
  const [p, setP] = useState<Partial<ProductRow>>(product ?? { category: categories[0]?.slug ?? "", stock: 10, active: 1, featured: 0 });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"en" | "ru">("en");
  const set = (k: keyof ProductRow, v: unknown) => setP((cur) => ({ ...cur, [k]: v }));
  const str = (k: keyof ProductRow) => (p[k] as string | null | undefined) ?? "";
  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  async function upload(file: File) {
    setMsg("Uploading photo...");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = (await r.json()) as { ok: boolean; url?: string; error?: string };
    if (j.ok && j.url) { set("image", j.url); setMsg("Photo uploaded."); } else setMsg(`Upload failed: ${j.error ?? r.status}`);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await adminSaveProduct({
      data: {
        id: product?.id ?? null,
        slug: str("slug") || slugify(str("name_en")),
        category: str("category"), brand: str("brand") || null,
        name_en: str("name_en"), name_ru: str("name_ru") || null, name_ar: str("name_ar") || null,
        desc_en: str("desc_en") || null, desc_ru: str("desc_ru") || null, desc_ar: str("desc_ar") || null,
        meta_title_en: str("meta_title_en") || null, meta_title_ru: str("meta_title_ru") || null, meta_title_ar: str("meta_title_ar") || null,
        meta_desc_en: str("meta_desc_en") || null, meta_desc_ru: str("meta_desc_ru") || null, meta_desc_ar: str("meta_desc_ar") || null,
        price_aed: Number(p.price_aed ?? 0), old_price_aed: p.old_price_aed ?? null,
        volume_ml: p.volume_ml ?? null, abv: p.abv ?? null, origin: str("origin") || null, image: str("image") || null,
        stock: Number(p.stock ?? 0), active: !!p.active, featured: !!p.featured,
      },
    });
    setBusy(false);
    if (res.ok) onDone();
    else setMsg(res.error === "slug_taken" ? "That URL slug is already used by another product." : "Could not save. Check the fields.");
  }

  async function del() {
    if (!product) return;
    setBusy(true);
    await adminDeleteProduct({ data: { id: product.id } });
    onDone();
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-[14px] border border-line bg-raised p-5 md:p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-fs20 font-bold text-ink">{product ? `Edit: ${product.name_en}` : "New product"}</h2>
        <button type="button" onClick={onDone} className="text-fs14 text-muted hover:text-ink">Close</button>
      </div>
      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          {str("image") ? <img src={str("image")} alt="" className="aspect-square w-full rounded-[10px] border border-line object-cover" /> : <div className="aspect-square w-full rounded-[10px] border border-dashed border-line-strong" />}
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload photo" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="w-full text-fs12 text-muted" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <L label="Name (English) *"><input required className={input} value={str("name_en")} onChange={(e) => set("name_en", e.target.value)} /></L>
          <L label="URL slug" hint="Leave empty to create from the name"><input className={input} value={str("slug")} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(str("name_en"))} /></L>
          <L label="Category">
            <select className={input} value={str("category")} onChange={(e) => set("category", e.target.value)}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name_en}</option>)}
            </select>
          </L>
          <L label="Brand"><input className={input} value={str("brand")} onChange={(e) => set("brand", e.target.value)} /></L>
          <L label="Price (AED) *"><input required type="number" step="0.01" min="0" className={input} value={p.price_aed ?? ""} onChange={(e) => set("price_aed", num(e.target.value))} /></L>
          <L label="Old price (AED)" hint="Shows a discount badge"><input type="number" step="0.01" min="0" className={input} value={p.old_price_aed ?? ""} onChange={(e) => set("old_price_aed", num(e.target.value))} /></L>
          <L label="Volume (ml)"><input type="number" min="0" className={input} value={p.volume_ml ?? ""} onChange={(e) => set("volume_ml", num(e.target.value))} /></L>
          <L label="Alcohol %"><input type="number" step="0.1" min="0" max="100" className={input} value={p.abv ?? ""} onChange={(e) => set("abv", num(e.target.value))} /></L>
          <L label="Origin"><input className={input} value={str("origin")} onChange={(e) => set("origin", e.target.value)} /></L>
          <L label="Stock"><input type="number" min="0" className={input} value={p.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} /></L>
          <label className="flex items-center gap-2 text-fs14 text-ink"><input type="checkbox" checked={!!p.active} onChange={(e) => set("active", e.target.checked ? 1 : 0)} /> Visible on site</label>
          <label className="flex items-center gap-2 text-fs14 text-ink"><input type="checkbox" checked={!!p.featured} onChange={(e) => set("featured", e.target.checked ? 1 : 0)} /> Best seller (home page)</label>
        </div>
      </div>

      <div>
        <div role="tablist" className="flex gap-1 border-b border-line">
          {(["en", "ru"] as const).map((l) => (
            <button key={l} type="button" role="tab" aria-selected={tab === l} onClick={() => setTab(l)}
              className={`px-4 py-2 text-fs13 font-semibold ${tab === l ? "border-b-2 border-gold text-ink" : "text-muted"}`}>
              {l === "en" ? "English" : "Russian"} text & SEO
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          {tab !== "en" ? <L label="Name"><input className={input} value={str(`name_${tab}` as keyof ProductRow)} onChange={(e) => set(`name_${tab}` as keyof ProductRow, e.target.value)} placeholder="Falls back to English" /></L> : null}
          <L label="Description"><textarea rows={3} className={area} value={str(`desc_${tab}` as keyof ProductRow)} onChange={(e) => set(`desc_${tab}` as keyof ProductRow, e.target.value)} /></L>
          <L label="SEO title" hint={`${str(`meta_title_${tab}` as keyof ProductRow).length}/60 characters. Empty = automatic.`}><input className={input} value={str(`meta_title_${tab}` as keyof ProductRow)} onChange={(e) => set(`meta_title_${tab}` as keyof ProductRow, e.target.value)} /></L>
          <L label="SEO description" hint={`${str(`meta_desc_${tab}` as keyof ProductRow).length}/160 characters. Empty = automatic.`}><textarea rows={2} className={area} value={str(`meta_desc_${tab}` as keyof ProductRow)} onChange={(e) => set(`meta_desc_${tab}` as keyof ProductRow, e.target.value)} /></L>
        </div>
      </div>

      {msg ? <p role="status" className="text-fs14 text-warn">{msg}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <button type="submit" disabled={busy} className="h-11 rounded-[10px] bg-gold px-6 text-fs15 font-semibold text-ongold disabled:opacity-60">{busy ? "Saving..." : "Save product"}</button>
        {product ? <button type="button" onClick={del} disabled={busy} className="text-fs14 font-semibold text-bad hover:underline">Delete product</button> : null}
      </div>
    </form>
  );
}
