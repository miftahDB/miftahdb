export const SQL_STATEMENTS = {
  // Gets a row from the table
  GET: "SELECT value, expires_at FROM miftahDB WHERE key = ?",

  // Sets a row in the table
  SET: "INSERT OR REPLACE INTO miftahDB (key, value, expires_at) VALUES (?, ?, ?)",

  // Deletes a row from the table
  DELETE: "DELETE FROM miftahDB WHERE key = ?",

  // Deletes rows that have expired
  CLEANUP:
    "DELETE FROM miftahDB WHERE expires_at IS NOT NULL AND expires_at <= ? AND key LIKE ?",

  // Renames a key
  RENAME: "UPDATE miftahDB SET key = ? WHERE key = ?",

  // Creates a table if it doesn't exist
  CREATE_TABLE: `
      CREATE TABLE IF NOT EXISTS miftahDB (
        key TEXT PRIMARY KEY,
        value BLOB,
        expires_at INTEGER
      ) WITHOUT ROWID;
    `,

  // Creates an index on the expires_at column
  CREATE_INDEX:
    "CREATE INDEX IF NOT EXISTS idx_expires_at ON miftahDB(expires_at) WHERE expires_at IS NOT NULL",

  // Optimizes the database file, reducing its size.
  VACUUM: "VACUUM",

  // Deletes all rows
  FLUSH: "DELETE FROM miftahDB WHERE key LIKE ?",

  // Returns true if the key exists, false otherwise
  EXISTS: "SELECT EXISTS (SELECT 1 FROM miftahDB WHERE key = ? LIMIT 1)",

  // Returns the expiration date for the given key
  GET_EXPIRE: "SELECT expires_at FROM miftahDB WHERE key = ?",

  // Updates the expiration date for the given key
  SET_EXPIRE: "UPDATE miftahDB SET expires_at = ? WHERE key = ?",

  // Returns all keys that match the given pattern
  KEYS: "SELECT key FROM miftahDB WHERE key LIKE ?",

  // Returns all keys that match the given pattern with pagination
  PAGINATION: "SELECT key FROM miftahDB WHERE key LIKE ? LIMIT ? OFFSET ?",

  // Counts the total number of rows
  COUNT_KEYS: "SELECT COUNT(*) AS count FROM miftahDB where key LIKE ?",

  // Counts the number of expired rows
  COUNT_EXPIRED:
    "SELECT COUNT(*) as count FROM miftahDB WHERE (expires_at IS NOT NULL AND expires_at <= ?) AND key LIKE ?",

  // PRAGMA statements
  CREATE_PRAGMA: `
    PRAGMA wal_checkpoint;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA temp_store = MEMORY;
    PRAGMA cache_size = -64000;
    PRAGMA mmap_size = 30000000000;
    PRAGMA optimize;
  `,
};
