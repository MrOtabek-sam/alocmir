import { createFileRoute } from "@tanstack/react-router";

import { AREA_PAGES, DEFAULT_LANG, LANGS, langUrl, type Lang } from "@/lib/store/i18n";
import { loadLivePostRows, postLangs, type PostRow } from "@/lib/store/blog.server";
import { db } from "@/lib/store/db.server";

function entry(rest: string, lastmod: string, priority: string, changefreq: string, langs: readonly Lang[] = LANGS) {
  const def = langs.includes(DEFAULT_LANG) ? DEFAULT_LANG : langs[0];
  return langs.map((l) => {
    const alts = [...langs.map((a) => `    <xhtml:link rel="alternate" hreflang="${a}" href="${langUrl(a, rest)}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${langUrl(def, rest)}"/>`].join("\n");
    return `  <url>\n    <loc>${langUrl(l, rest)}</loc>\n${alts}\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }).join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);
        let cats: { slug: string }[] = [];
        let prods: { slug: string; updated_at: string }[] = [];
        let posts: PostRow[] = [];
        try {
          cats = (await db().prepare("SELECT slug FROM categories ORDER BY sort").all<{ slug: string }>()).results ?? [];
          prods = (await db().prepare("SELECT slug, updated_at FROM products WHERE active = 1").all<{ slug: string; updated_at: string }>()).results ?? [];
          posts = await loadLivePostRows();
        } catch {
          /* database not ready */
        }
        const parts = [
          entry("", today, "1.0", "daily"),
          entry("/catalog", today, "0.9", "daily"),
          entry("/delivery", today, "0.7", "monthly"),
          ...cats.map((c) => entry(`/catalog/${c.slug}`, today, "0.8", "weekly")),
          ...AREA_PAGES.map((a) => entry(`/delivery/${a.slug}`, today, "0.8", "weekly")),
          ...prods.map((p) => entry(`/product/${p.slug}`, (p.updated_at || today).slice(0, 10), "0.7", "weekly")),
          entry("/blog", (posts[0]?.publish_at ?? today).slice(0, 10), "0.7", "daily"),
          ...posts.map((p) => {
            const langs = postLangs(p);
            const lastmod = (p.updated_at > p.publish_at ? p.updated_at : p.publish_at).slice(0, 10);
            return langs.length ? entry(`/blog/${p.slug}`, lastmod, "0.6", "monthly", langs) : "";
          }).filter(Boolean),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${parts.join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
