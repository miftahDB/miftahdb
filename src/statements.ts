export const SQL_STATEMENTS = {
  GET: "SELECT value, expires_at FROM miftahDB WHERE key = ? LIMIT 1",
  SET: "INSERT OR REPLACE INTO miftahDB (key, value, expires_at) VALUES (?, ?, ?)",
  DELETE: "DELETE FROM miftahDB WHERE key = ?",
  CLEANUP:
    "DELETE FROM miftahDB WHERE expires_at IS NOT NULL AND expires_at <= ?",
  RENAME: "UPDATE OR IGNORE miftahDB SET key = ? WHERE key = ?",
  CREATE_TABLE: `
      CREATE TABLE IF NOT EXISTS miftahDB (
        key TEXT PRIMARY KEY,
        value BLOB,
        expires_at INTEGER
      ) WITHOUT ROWID;
    `,
  CREATE_INDEX:
    "CREATE INDEX IF NOT EXISTS idx_expires_at ON miftahDB(expires_at);",
  VACUUM: "VACUUM",
  FLUSH: "DELETE FROM miftahDB",
};
