import { useState, type FormEvent, type ReactNode } from "react";

import { RichText } from "@/components/store/rich-text";
import { adminDeletePost, adminSavePost } from "@/lib/store/admin.functions";
import type { PostRow } from "@/lib/store/blog.server";

const input = "h-10 w-full rounded-[8px] border border-line-strong bg-surface px-3 text-fs14 text-ink";
const area = "w-full rounded-[8px] border border-line-strong bg-surface px-3 py-2 text-fs14 leading-relaxed text-ink";
const DUBAI_OFFSET_MS = 4 * 3600 * 1000;

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
function slugify(s: string) {
  return s.toLowerCase().replace(/[а-яё]/g, (c) => CYR[c] ?? "").normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

/** SQLite UTC datetime to a datetime-local value in Dubai time. */
function toDubaiInput(utc: string) {
  return new Date(new Date(`${utc.replace(" ", "T")}Z`).getTime() + DUBAI_OFFSET_MS).toISOString().slice(0, 16);
}
/** datetime-local value (Dubai time) to SQLite UTC datetime. */
function fromDubaiInput(local: string) {
  return new Date(new Date(`${local}:00Z`).getTime() - DUBAI_OFFSET_MS).toISOString().slice(0, 19).replace("T", " ");
}
function nowSql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function L({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1 text-fs13 font-semibold text-muted">
      {label}
      {children}
      {hint ? <span className="font-normal">{hint}</span> : null}
    </label>
  );
}

const FORMAT_HELP = "Blank line = new paragraph · ## Heading · ### Subheading · - list item · 1. numbered · > tip box · **bold** · [link text](/ru/catalog/whisky)";

export function PostForm({ post, productSlugs, onDone }: { post: PostRow | null; productSlugs: string[]; onDone: () => void }) {
  const [p, setP] = useState<Partial<PostRow>>(post ?? { publish_at: nowSql(), active: 1, cover: "/assets/products/sparkling.jpg" });
  const [tab, setTab] = useState<"ru" | "en">("ru");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: keyof PostRow, v: unknown) => setP((cur) => ({ ...cur, [k]: v }));
  const str = (k: keyof PostRow) => (p[k] as string | null | undefined) ?? "";
  const autoSlug = slugify(str("title_en") || str("title_ru"));

  async function upload(file: File) {
    setMsg("Uploading cover...");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = (await r.json()) as { ok: boolean; url?: string; error?: string };
    if (j.ok && j.url) { set("cover", j.url); setMsg("Cover uploaded."); } else setMsg(`Upload failed: ${j.error ?? r.status}`);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const hasRu = str("title_ru") && str("body_ru");
    const hasEn = str("title_en") && str("body_en");
    if (!hasRu && !hasEn) { setMsg("Add a title and text in at least one language."); return; }
    setBusy(true);
    setMsg("");
    const n = (k: keyof PostRow) => str(k).trim() || null;
    const res = await adminSavePost({
      data: {
        id: post?.id ?? null,
        slug: str("slug") || autoSlug,
        cover: n("cover"), publish_at: str("publish_at") || nowSql(), active: !!p.active, products: n("products"),
        title_ru: n("title_ru"), title_en: n("title_en"), excerpt_ru: n("excerpt_ru"), excerpt_en: n("excerpt_en"),
        body_ru: n("body_ru"), body_en: n("body_en"), meta_title_ru: n("meta_title_ru"), meta_title_en: n("meta_title_en"),
        meta_desc_ru: n("meta_desc_ru"), meta_desc_en: n("meta_desc_en"),
      },
    });
    setBusy(false);
    if (res.ok) onDone();
    else setMsg(res.error === "slug_taken" ? "That URL slug is already used by another post." : "Could not save. Check the fields.");
  }

  async function del() {
    if (!post || !window.confirm("Delete this post permanently?")) return;
    setBusy(true);
    await adminDeletePost({ data: { id: post.id } });
    onDone();
  }

  const chosen = str("products").split(",").map((s) => s.trim()).filter(Boolean);
  const toggleProduct = (slug: string) =>
    set("products", (chosen.includes(slug) ? chosen.filter((s) => s !== slug) : [...chosen, slug]).join(","));

  return (
    <form onSubmit={save} className="space-y-6 rounded-[14px] border border-line bg-raised p-5 md:p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-fs20 font-bold text-ink">{post ? `Edit: ${post.title_ru || post.title_en}` : "New post"}</h2>
        <button type="button" onClick={onDone} className="text-fs14 text-muted hover:text-ink">Close</button>
      </div>

      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          {str("cover") ? <img src={str("cover")} alt="" className="aspect-[16/10] w-full rounded-[10px] border border-line object-cover" /> : <div className="aspect-[16/10] w-full rounded-[10px] border border-dashed border-line-strong" />}
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload cover" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="w-full text-fs12 text-muted" />
          <L label="Cover image URL"><input className={input} value={str("cover")} onChange={(e) => set("cover", e.target.value)} /></L>
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2">
          <L label="URL slug" hint="Leave empty to create from the title"><input className={input} value={str("slug")} onChange={(e) => set("slug", e.target.value)} placeholder={autoSlug} /></L>
          <L label="Publish at (Dubai time)" hint="A future date schedules the post; it goes live automatically.">
            <input type="datetime-local" required className={input} value={str("publish_at") ? toDubaiInput(str("publish_at")) : ""}
              onChange={(e) => e.target.value && set("publish_at", fromDubaiInput(e.target.value))} />
          </L>
          <label className="flex items-center gap-2 text-fs14 text-ink sm:col-span-2">
            <input type="checkbox" checked={!!p.active} onChange={(e) => set("active", e.target.checked ? 1 : 0)} /> Visible (untick to hide without deleting)
          </label>
          <div className="sm:col-span-2">
            <p className="text-fs13 font-semibold text-muted">Products shown under the post ({chosen.length})</p>
            <div className="mt-2 flex max-h-[148px] flex-wrap gap-1.5 overflow-y-auto">
              {productSlugs.map((s) => (
                <button key={s} type="button" onClick={() => toggleProduct(s)} aria-pressed={chosen.includes(s)}
                  className={`rounded-full border px-3 py-1 text-fs12 ${chosen.includes(s) ? "border-gold bg-gold text-ongold" : "border-line-strong text-muted hover:text-ink"}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between border-b border-line">
          <div role="tablist" className="flex gap-1">
            {(["ru", "en"] as const).map((l) => (
              <button key={l} type="button" role="tab" aria-selected={tab === l} onClick={() => setTab(l)}
                className={`px-4 py-2 text-fs13 font-semibold ${tab === l ? "border-b-2 border-gold text-ink" : "text-muted"}`}>
                {l === "ru" ? "Russian (main)" : "English"}{str(`title_${l}`) && str(`body_${l}`) ? " ✓" : ""}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPreview((v) => !v)} className="px-3 py-2 text-fs13 font-semibold text-link">{preview ? "Edit" : "Preview"}</button>
        </div>
        {preview ? (
          <div className="mt-4 rounded-[12px] border border-line bg-surface p-6">
            <h1 className="text-fs36 leading-tight text-ink">{str(`title_${tab}`) || "(no title)"}</h1>
            <p className="mb-6 mt-3 text-fs17 text-ink/75">{str(`excerpt_${tab}`)}</p>
            <RichText source={str(`body_${tab}`)} />
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <L label="Title"><input className={input} value={str(`title_${tab}`)} onChange={(e) => set(`title_${tab}`, e.target.value)} /></L>
            <L label="Short intro" hint="Shown under the title and on the blog list (1-2 sentences)."><textarea rows={2} className={area} value={str(`excerpt_${tab}`)} onChange={(e) => set(`excerpt_${tab}`, e.target.value)} /></L>
            <L label="Text" hint={FORMAT_HELP}><textarea rows={18} className={area} value={str(`body_${tab}`)} onChange={(e) => set(`body_${tab}`, e.target.value)} /></L>
            <L label="SEO title" hint={`${str(`meta_title_${tab}`).length}/60 characters. Empty = the title.`}><input className={input} value={str(`meta_title_${tab}`)} onChange={(e) => set(`meta_title_${tab}`, e.target.value)} /></L>
            <L label="SEO description" hint={`${str(`meta_desc_${tab}`).length}/160 characters. Empty = the short intro.`}><textarea rows={2} className={area} value={str(`meta_desc_${tab}`)} onChange={(e) => set(`meta_desc_${tab}`, e.target.value)} /></L>
          </div>
        )}
      </div>

      {msg ? <p role="status" className="text-fs14 text-warn">{msg}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <button type="submit" disabled={busy} className="h-11 rounded-[10px] bg-gold px-6 text-fs15 font-semibold text-ongold disabled:opacity-60">{busy ? "Saving..." : "Save post"}</button>
        {post ? <button type="button" onClick={del} disabled={busy} className="text-fs14 font-semibold text-bad hover:underline">Delete post</button> : null}
      </div>
    </form>
  );
}
