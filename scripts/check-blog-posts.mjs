// Validates the bundled blog posts before they are seeded: covers exist, slugs are unique, SEO fields fit,
// and every internal link points at a real page (blog links only at posts published EARLIER).
// Usage: npm run blog:check
import { existsSync, readFileSync } from "node:fs";
import { POSTS } from "./blog-posts/index.mjs";

const sql = readFileSync("migrations/0001_store.sql", "utf8");
const categories = new Set([...sql.matchAll(/^\('([a-z0-9-]+)',\s*\d+,/gm)].map((m) => m[1]));
const products = new Set([...sql.matchAll(/^\('([a-z0-9-]+)','[a-z-]+',/gm)].map((m) => m[1]));
const i18n = readFileSync("src/lib/store/i18n.ts", "utf8");
const areas = new Set([...i18n.matchAll(/\{ slug: "([a-z0-9-]+)", name:/g)].map((m) => m[1]));

const errors = [];
const seen = new Set();
const err = (p, msg) => errors.push(`${p.slug}: ${msg}`);

POSTS.forEach((p, i) => {
  if (seen.has(p.slug)) err(p, "duplicate slug");
  seen.add(p.slug);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) err(p, "bad slug");
  if (!existsSync(`public${p.cover}`)) err(p, `missing cover ${p.cover}`);
  for (const s of p.products) if (!products.has(s)) err(p, `unknown product ${s}`);
  const earlier = new Set(POSTS.slice(0, i).map((q) => q.slug));
  for (const lang of ["ru", "en"]) {
    const c = p[lang];
    for (const k of ["title", "excerpt", "body", "metaTitle", "metaDesc"]) if (!c?.[k]?.trim()) err(p, `${lang}.${k} empty`);
    if (c.metaTitle.length > 60) err(p, `${lang}.metaTitle ${c.metaTitle.length} > 60`);
    if (c.metaDesc.length > 160) err(p, `${lang}.metaDesc ${c.metaDesc.length} > 160`);
    if (c.body.includes("`")) err(p, `${lang}.body contains a backtick`);
    for (const [, href] of c.body.matchAll(/\]\(([^)\s]+)\)/g)) {
      const m = href.match(/^\/(ru|en)\/(.*)$/);
      if (!m) { err(p, `${lang}: external or unprefixed link ${href}`); continue; }
      if (m[1] !== lang) err(p, `${lang}: link to other language ${href}`);
      const [section, slug, extra] = m[2].split("/");
      if (extra !== undefined) err(p, `${lang}: link too deep ${href}`);
      else if (section === "catalog") { if (slug && !categories.has(slug)) err(p, `${lang}: unknown category ${href}`); }
      else if (section === "delivery") { if (slug && !areas.has(slug)) err(p, `${lang}: unknown area ${href}`); }
      else if (section === "blog") { if (!earlier.has(slug)) err(p, `${lang}: links to a post that is not published earlier ${href}`); }
      else err(p, `${lang}: unknown section ${href}`);
    }
  }
});

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s) in ${POSTS.length} posts.`);
  process.exit(1);
}
const words = POSTS.map((p) => p.ru.body.split(/\s+/).length);
console.log(`${POSTS.length} posts OK. Russian length ${Math.min(...words)}-${Math.max(...words)} words.`);
