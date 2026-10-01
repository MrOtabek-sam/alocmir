import { db } from "./db.server";
import { LANGS, type Lang } from "./i18n";

export type PostRow = {
  id: number; slug: string; cover: string | null; publish_at: string; active: number; products: string | null;
  title_ru: string | null; title_en: string | null; excerpt_ru: string | null; excerpt_en: string | null;
  body_ru: string | null; body_en: string | null; meta_title_ru: string | null; meta_title_en: string | null;
  meta_desc_ru: string | null; meta_desc_en: string | null; created_at: string; updated_at: string;
};

export type Post = {
  slug: string; cover: string; title: string; excerpt: string; body: string;
  metaTitle: string | null; metaDesc: string | null; publishedAt: string; updatedAt: string;
  products: string[]; langs: Lang[]; minutes: number;
};

const LIVE = "active = 1 AND publish_at <= datetime('now')";

function field(row: PostRow, base: "title" | "excerpt" | "body" | "meta_title" | "meta_desc", lang: Lang) {
  const v = row[`${base}_${lang}`];
  return v && v.trim() ? v : null;
}

/** Languages a post can be shown in: those with both a title and a body. */
export function postLangs(row: PostRow): Lang[] {
  return LANGS.filter((l) => field(row, "title", l) && field(row, "body", l));
}

/** UTC "YYYY-MM-DD HH:MM:SS" (SQLite datetime) to ISO 8601. */
export function sqlToIso(s: string) {
  return `${s.replace(" ", "T")}Z`;
}

export function localizePost(row: PostRow, lang: Lang): Post | null {
  const title = field(row, "title", lang);
  const body = field(row, "body", lang);
  if (!title || !body) return null;
  const words = body.split(/\s+/).length;
  return {
    slug: row.slug,
    cover: row.cover || "/assets/products/sparkling.jpg",
    title,
    excerpt: field(row, "excerpt", lang) ?? body.replace(/[#*[\]()>-]/g, "").slice(0, 180),
    body,
    metaTitle: field(row, "meta_title", lang),
    metaDesc: field(row, "meta_desc", lang),
    publishedAt: sqlToIso(row.publish_at),
    updatedAt: sqlToIso(row.updated_at > row.publish_at ? row.updated_at : row.publish_at),
    products: (row.products ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    langs: postLangs(row),
    minutes: Math.max(1, Math.round(words / 200)),
  };
}

export async function loadPosts(lang: Lang, limit = 60): Promise<Post[]> {
  const res = await db().prepare(`SELECT * FROM posts WHERE ${LIVE} ORDER BY publish_at DESC LIMIT ?`).bind(limit * 2).all<PostRow>();
  return (res.results ?? []).map((r) => localizePost(r, lang)).filter((p): p is Post => !!p).slice(0, limit);
}

export async function loadPost(slug: string): Promise<PostRow | null> {
  return db().prepare(`SELECT * FROM posts WHERE slug = ? AND ${LIVE}`).bind(slug).first<PostRow>();
}

export async function loadLivePostRows(): Promise<PostRow[]> {
  return (await db().prepare(`SELECT * FROM posts WHERE ${LIVE} ORDER BY publish_at DESC`).all<PostRow>()).results ?? [];
}
