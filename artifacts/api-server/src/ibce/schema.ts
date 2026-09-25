import { pool } from "@workspace/db";

/**
 * IBCE export history is provisioned at startup rather than through a
 * migration so a newly deployed public download endpoint is immediately
 * usable against an existing database.
 */
export async function ensureIbceSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ibce_export_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      export_kind TEXT NOT NULL,
      dataset_key TEXT,
      filename TEXT NOT NULL,
      status TEXT NOT NULL,
      rows BIGINT,
      bytes BIGINT,
      sha256 TEXT,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      error_summary TEXT
    );
    CREATE INDEX IF NOT EXISTS ibce_export_history_requested_idx
      ON ibce_export_history (requested_at DESC);
    CREATE INDEX IF NOT EXISTS ibce_export_history_status_idx
      ON ibce_export_history (status);
  `);
}
