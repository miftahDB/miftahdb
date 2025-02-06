export const SQL_STATEMENTS = {
  // Creates the table
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS miftahDB (
      key TEXT PRIMARY KEY,
      value BLOB,
      expires_at INTEGER
    ) WITHOUT ROWID;
  `,

  // Creates an index on the expires_at column for efficient expiration checking
  CREATE_INDEX:
    "CREATE INDEX IF NOT EXISTS idx_expires_at ON miftahDB(expires_at) WHERE expires_at IS NOT NULL",

  // PRAGMA statements
  CREATE_PRAGMA: `
  PRAGMA wal_checkpoint;
  PRAGMA journal_mode = %journal_mode;
  PRAGMA synchronous = %synchronous_mode;
  PRAGMA temp_store = %temp_store_mode;
  PRAGMA cache_size = %cache_size;
  PRAGMA mmap_size = %mmap_size;
  PRAGMA locking_mode = %locking_mode;
  PRAGMA auto_vacuum = %auto_vacuum_mode;
  PRAGMA optimize;
  `,

  // Gets a row from the table
  GET: "SELECT value, expires_at FROM miftahDB WHERE key = ?",

  // Sets a row in the table
  SET: "INSERT OR REPLACE INTO miftahDB (key, value, expires_at) VALUES (?, ?, ?)",

  // Deletes a row from the table
  DELETE: "DELETE FROM miftahDB WHERE key = ?",

  // Deletes expired rows from the table
  CLEANUP:
    "DELETE FROM miftahDB WHERE expires_at IS NOT NULL AND expires_at <= ? AND key LIKE ?",

  // Renames a key in the table
  RENAME: "UPDATE miftahDB SET key = ? WHERE key = ?",

  // Optimizes the database file, reducing its size
  VACUUM: "VACUUM",

  // Deletes all rows
  FLUSH: "DELETE FROM miftahDB WHERE key LIKE ?",

  // Returns if the key exists in the table
  EXISTS: "SELECT EXISTS (SELECT 1 FROM miftahDB WHERE key = ? LIMIT 1)",

  // Returns the expiration date for the given key
  GET_EXPIRE: "SELECT expires_at FROM miftahDB WHERE key = ?",

  // Updates the expiration date for the given key
  SET_EXPIRE: "UPDATE miftahDB SET expires_at = ? WHERE key = ?",

  // Returns all keys that match the given pattern
  KEYS: "SELECT key FROM miftahDB WHERE key LIKE ?",

  // Returns all keys that match the given pattern with pagination
  PAGINATION: "SELECT key FROM miftahDB WHERE key LIKE ? LIMIT ? OFFSET ?",

  // Returns an array of keys that have expired between the given start and end dates
  GET_EXPIRED_RANGE:
    "SELECT key FROM miftahDB WHERE key LIKE ? AND expires_at >= ? AND expires_at <= ?",

  // Counts the total number of rows
  COUNT_KEYS: "SELECT COUNT(*) AS count FROM miftahDB where key LIKE ?",

  // Counts the number of expired rows
  COUNT_EXPIRED:
    "SELECT COUNT(*) as count FROM miftahDB WHERE (expires_at IS NOT NULL AND expires_at <= ?) AND key LIKE ?",
};
