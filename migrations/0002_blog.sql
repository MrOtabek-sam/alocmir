-- Blog posts. A post goes live when publish_at (UTC) has passed, so scheduled posts need no cron job.
-- A post is shown in a language only when it has a title and body in that language.
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  cover TEXT,
  publish_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  products TEXT,
  title_ru TEXT, title_en TEXT,
  excerpt_ru TEXT, excerpt_en TEXT,
  body_ru TEXT, body_en TEXT,
  meta_title_ru TEXT, meta_title_en TEXT,
  meta_desc_ru TEXT, meta_desc_en TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS posts_live ON posts (active, publish_at);
