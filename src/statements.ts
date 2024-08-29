export const SQL_STATEMENTS = {
  GET: "SELECT value, expires_at FROM key_value_store WHERE key = ? LIMIT 1",
  SET: "INSERT OR REPLACE INTO key_value_store (key, value, expires_at) VALUES (?, ?, ?)",
  DELETE: "DELETE FROM key_value_store WHERE key = ?",
  CLEANUP:
    "DELETE FROM key_value_store WHERE expires_at IS NOT NULL AND expires_at <= ?",
  RENAME: "UPDATE OR IGNORE key_value_store SET key = ? WHERE key = ?",
  CREATE_TABLE: `
      CREATE TABLE IF NOT EXISTS key_value_store (
        key TEXT PRIMARY KEY,
        value BLOB,
        expires_at INTEGER
      ) WITHOUT ROWID;
    `,
  CREATE_INDEX:
    "CREATE INDEX IF NOT EXISTS idx_expires_at ON key_value_store(expires_at);",
  VACUUM: "VACUUM",
};
