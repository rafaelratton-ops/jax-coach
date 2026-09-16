PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  queue TEXT NOT NULL,
  champion TEXT NOT NULL,
  role TEXT NOT NULL,
  opponent TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win','loss','remake')),
  kda TEXT NOT NULL,
  cs INTEGER NOT NULL,
  source TEXT NOT NULL,
  analyzed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facts (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  occurred_at TEXT NOT NULL,
  kind TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence REAL NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  champion TEXT NOT NULL,
  opponent TEXT NOT NULL,
  action TEXT NOT NULL,
  statement TEXT NOT NULL,
  safe_mode_copy TEXT NOT NULL,
  confidence REAL NOT NULL,
  occurrences INTEGER NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recordings (
  path TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  confidence REAL NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facts_match ON facts(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_started ON matches(started_at DESC);
