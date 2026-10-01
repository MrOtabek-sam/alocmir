// Adds the bundled blog posts to the database on first run and schedules them:
// the first LAUNCH_NOW posts go live immediately, then one every EVERY_DAYS days at 10:00 Dubai time.
// Existing posts (same slug) are never touched, so edits made in the admin survive re-running db:migrate.
import { POSTS } from "./blog-posts/index.mjs";

const LAUNCH_NOW = 3;
const EVERY_DAYS = 3;
const DAY = 86_400_000;
const PUBLISH_HOUR_UTC = 6; // 10:00 in Dubai (UTC+4)

const sqlDate = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

export async function seedBlog(db) {
  const existing = new Set((await db.execute("SELECT slug FROM posts")).rows.map((r) => r.slug));
  const now = Date.now();
  const firstSlot = new Date(now);
  firstSlot.setUTCHours(PUBLISH_HOUR_UTC, 0, 0, 0);
  let added = 0;
  for (const [i, p] of POSTS.entries()) {
    if (existing.has(p.slug)) continue;
    // Launch posts are staggered by a minute so the first one in the list is shown first.
    const at = i < LAUNCH_NOW ? now - (i + 1) * 60_000 : firstSlot.getTime() + (i - LAUNCH_NOW + 1) * EVERY_DAYS * DAY;
    await db.execute({
      sql: `INSERT OR IGNORE INTO posts (slug, cover, publish_at, active, products, title_ru, title_en, excerpt_ru, excerpt_en,
        body_ru, body_en, meta_title_ru, meta_title_en, meta_desc_ru, meta_desc_en) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.slug, p.cover, sqlDate(at), p.products.join(","), p.ru.title, p.en.title, p.ru.excerpt, p.en.excerpt,
        p.ru.body.trim(), p.en.body.trim(), p.ru.metaTitle, p.en.metaTitle, p.ru.metaDesc, p.en.metaDesc],
    });
    added++;
  }
  return added;
}
