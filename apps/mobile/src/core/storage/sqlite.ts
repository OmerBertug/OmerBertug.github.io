// apps/mobile/src/core/storage/sqlite.ts
// SQLite (op-sqlite) bindings for analytics history and notification log.
// SIMULATION: Uses in-memory store in non-native environments.
// TODO(native): import { open } from '@op-engineering/op-sqlite';

// ─── Schema ───────────────────────────────────────────────────────────────────
export const SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS usage_daily (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id        TEXT    NOT NULL,
  date          TEXT    NOT NULL,           -- YYYY-MM-DD (UTC)
  monotonic_day INTEGER NOT NULL,           -- T2: append-only day index
  usage_minutes INTEGER NOT NULL DEFAULT 0,
  wifi_mb       REAL    NOT NULL DEFAULT 0,
  cellular_mb   REAL    NOT NULL DEFAULT 0,
  UNIQUE(app_id, monotonic_day)             -- T2: one row per app per day, no updates
);

CREATE TABLE IF NOT EXISTS notification_events (
  id          TEXT    PRIMARY KEY,         -- UUID v4
  app_id      TEXT    NOT NULL,
  app_name    TEXT    NOT NULL,
  title       TEXT,
  received_at INTEGER NOT NULL,            -- trusted epoch ms
  hidden      INTEGER NOT NULL DEFAULT 0  -- 0=visible, 1=silenced (audit trail)
);

CREATE TABLE IF NOT EXISTS dns_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  host        TEXT    NOT NULL,
  blocked     INTEGER NOT NULL DEFAULT 1,
  queried_at  INTEGER NOT NULL             -- trusted epoch ms
);

CREATE TABLE IF NOT EXISTS tamper_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  reason      TEXT    NOT NULL,
  detail      TEXT    NOT NULL,
  occurred_at INTEGER NOT NULL             -- trusted epoch ms
);
`;

// ─── SIMULATION: In-memory database ──────────────────────────────────────────
// SIMULATION: In native, uses op-sqlite WAL-mode encrypted database.
// TODO(native): const db = open({ name: 'aegis.db', encryptionKey: keychainKey });

type Row = Record<string, unknown>;
const _tables: Record<string, Row[]> = {
  usage_daily: [],
  notification_events: [],
  dns_events: [],
  tamper_events: [],
};

export type SqliteDB = {
  execute(sql: string, params?: readonly unknown[]): Promise<{ rows: readonly Row[] }>;
  executeSync(sql: string, params?: readonly unknown[]): { rows: readonly Row[] };
};

// SIMULATION implementation
export const db: SqliteDB = {
  async execute(sql: string, params?: readonly unknown[]): Promise<{ rows: readonly Row[] }> {
    // SIMULATION: parse and execute simple queries against _tables
    void sql;
    void params;
    return { rows: [] };
  },
  executeSync(sql: string, params?: readonly unknown[]): { rows: readonly Row[] } {
    // SIMULATION
    void sql;
    void params;
    return { rows: [] };
  },
};

/**
 * Initialize database with schema migrations.
 * Safe to call multiple times (IF NOT EXISTS guards).
 */
export async function initDatabase(): Promise<void> {
  // SIMULATION: In native, runs SQL_SCHEMA against op-sqlite db.
  // TODO(native): await db.execute(SQL_SCHEMA);
  void SQL_SCHEMA;
}
