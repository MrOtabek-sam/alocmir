-- First-party analytics: page views and key actions. No personal data: visitor/session are random IDs
-- generated in the browser, and IP addresses are never stored (country comes from the hosting edge).
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  visitor TEXT NOT NULL,
  session TEXT NOT NULL,
  path TEXT,
  source TEXT,
  lang TEXT,
  device TEXT,
  country TEXT,
  label TEXT,
  value REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS events_time ON events (created_at);
CREATE INDEX IF NOT EXISTS events_type_time ON events (type, created_at);
