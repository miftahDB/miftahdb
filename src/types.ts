/**
 * Represents the possible types of values that can be stored in MiftahDB.
 */
export type MiftahValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>
  | Date
  | Uint8Array
  | Buffer
  | null;

/**
 * Interface for the MiftahDB class, defining its public methods.
 */
export interface IMiftahDB<T extends MiftahValue = MiftahValue> {
  /**
   * Retrieves a value from the database by its key.
   * - https://miftahdb.sqlite3.online/docs/api-reference/get
   * @param key - The key to look up.
   * @returns The value associated with the key, or null if not found or expired.
   * @example
   * const value = db.get('user:1234');
   */
  get(key: string): T | null;

  /**
   * Sets a value in the database with an optional expiration.
   * - https://miftahdb.sqlite3.online/docs/api-reference/set
   * @param key - The key under which to store the value.
   * @param value - The value to store.
   * @param expiresAt - Optional expiration date for the key-value pair.
   * @example
   * db.set('user:1234', { name: 'Ahmad' }, new Date('2023-12-31'));
   */
  set(key: string, value: T, expiresAt?: Date): void;

  /**
   * Gets the expiration date of a key.
   * - https://miftahdb.sqlite3.online/docs/api-reference/getexpire
   * @param key - The key to check.
   * @returns The expiration date of the key, or null if the key doesn't exist or has no expiration.
   * @example
   * const expirationDate = db.getExpire('user:1234');
   */
  getExpire(key: string): Date | null;

  /**
   * Sets the expiration date of a key.
   * - https://miftahdb.sqlite3.online/docs/api-reference/setexpire
   * @param key - The key to set the expiration date for.
   * @param expiresAt - The expiration date to set.
   * @example
   * db.setExpire('user:1234', new Date('2028-12-31'));
   */
  setExpire(key: string, expiresAt: Date): void;

  /**
   * Checks if a key exists in the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/exists
   * @param key - The key to check.
   * @returns True if the key exists and hasn't expired, false otherwise.
   * @example
   * if (db.exists('user:1234')) {
   *   console.log('User exists');
   * }
   */
  exists(key: string): boolean;

  /**
   * Deletes a key-value pair from the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/delete
   * @param key - The key to delete.
   * @example
   * db.delete('user:1234');
   */
  delete(key: string): void;

  /**
   * Renames a key in the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/rename
   * @param oldKey - The current key name.
   * @param newKey - The new key name.
   * @example
   * db.rename('user:old_id', 'user:new_id');
   */
  rename(oldKey: string, newKey: string): void;

  /**
   * Retrieves keys matching a pattern.
   * - https://miftahdb.sqlite3.online/docs/api-reference/keys
   * @param {string} [pattern="%"] - Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
   *                                 Use "%" to match any sequence of characters and "_" to match any single character.
   * @returns {string[]} An array of matching keys.
   * @example
   * // Get all keys
   * const allKeys = db.keys();
   *
   * // Get keys starting with "user:"
   * const userKeys = db.keys('user:%');
   *
   * // Get keys with exactly 5 characters
   * const fiveCharKeys = db.keys('_____');
   *
   * // Get keys starting with "log", followed by exactly two characters, and ending with any number of characters
   * const logKeys = db.keys('log__:%');
   */
  keys(pattern: string): string[];

  /**
   * Retrieves a paginated list of keys matching a pattern.
   * - https://miftahdb.sqlite3.online/docs/api-reference/pagination
   * @param limit - The maximum number of keys to return per page.
   * @param page - The page number to retrieve (1-based index).
   * @param pattern - Optional SQL LIKE pattern to match keys. Use "%" to match any sequence of characters and "_" to match any single character.
   * @returns An array of keys that match the pattern, limited to the specified number per page.
   * @example
   * // Get the first 5 keys from the database
   * const firstPage = db.pagination(5, 1);
   *
   * // Get the first 10 keys matching "user:%" (keys starting with "user:")
   * const firstUsersPage = db.pagination(10, 1, 'user:%');
   *
   * // Get the next 10 keys matching "user:%" (keys starting with "user:")
   * const secondUsersPage = db.pagination(10, 2, "user:%");
   */
  pagination(limit: number, page: number, pattern: string): string[];

  /**
   * Counts the number of keys in the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/count
   * @param pattern - Optional SQL LIKE pattern to match keys. Use "%" to match any sequence of characters and "_" to match any single character.
   * @returns The number of keys in the database.
   * @example
   * // Get the total number of keys
   * const count = db.count();
   *
   * // Get the number of keys matching "user:%"
   * const userCount = db.count('user:%');
   */
  count(pattern?: string): number;

  /**
   * Counts the number of expired keys in the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/countexpired
   * @param pattern - Optional SQL LIKE pattern to match keys. Use "%" to match any sequence of characters and "_" to match any single character.
   * @returns The number of expired keys in the database.
   * @example
   * // Get the total number of expired keys
   * const countExpired = db.countExpired();
   *
   * // Get the number of expired keys matching "user:%"
   * const userCountExpired = db.countExpired('user:%');
   */
  countExpired(pattern?: string): number;

  /**
   * Retrieves multiple values from the database by their keys.
   * - https://miftahdb.sqlite3.online/docs/api-reference/multiget
   * @param keys - An array of keys to look up.
   * @returns An object with keys and their corresponding values, or empty object if keys are not found or expired.
   * @example
   * const values = db.multiGet(['user:1234', 'user:5678']);
   */
  multiGet(keys: string[]): Record<string, T | null>;

  /**
   * Sets multiple key-value pairs in the database with optional expirations.
   * - https://miftahdb.sqlite3.online/docs/api-reference/multiset
   * @param entries - An array of objects containing key, value, and optional expiresAt.
   * @example
   * db.multiSet([
   *   { key: 'user:1234', value: { name: 'Ahmad' }, expiresAt: new Date('2023-12-31') },
   *   { key: 'user:5678', value: { name: 'Fatima' } }
   * ]);
   */
  multiSet(entries: Array<{ key: string; value: T; expiresAt?: Date }>): void;

  /**
   * Deletes multiple key-value pairs from the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/multidelete
   * @param keys - An array of keys to delete.
   * @example
   * db.multiDelete(['user:1234', 'user:5678']);
   */
  multiDelete(keys: string[]): void;

  /**
   * Removes expired key-value pairs from the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/cleanup
   * @example
   * db.cleanup();
   */
  cleanup(): void;

  /**
   * Optimizes the database file, reducing its size.
   * - https://miftahdb.sqlite3.online/docs/api-reference/vacuum
   * @example
   * db.vacuum();
   */
  vacuum(): void;

  /**
   * Closes the database connection.
   * - https://miftahdb.sqlite3.online/docs/api-reference/close
   * @example
   * db.close();
   */
  close(): void;

  /**
   * Ensures all the changes written to disk.
   * - https://miftahdb.sqlite3.online/docs/api-reference/flush
   * @example
   * db.flush();
   */
  flush(): void;

  /**
   * Executes a raw SQL statement and returns the result.
   * - https://miftahdb.sqlite3.online/docs/api-reference/execute
   * @param sql - The SQL statement to execute. Be cautious with raw SQL to avoid SQL injection vulnerabilities.
   * @param params - Optional parameters to bind to the SQL statement.
   * @returns The result of the SQL query. If the statement is a `SELECT` query, it returns the query result. Otherwise, it returns the database instance.
   * @example
   * // Execute a SELECT statement and get results
   * const rows = db.execute("SELECT * FROM miftahdb WHERE key LIKE ? LIMIT 5;", ["%"]);
   *
   * // Execute an DELETE statement
   * db.execute("DELETE FROM miftahdb WHERE key LIKE ?", ["user:1234"]);
   */
  execute(sql: string, params?: unknown[]): unknown;

  /**
   * Backups the database to a file.
   * - https://miftahdb.sqlite3.online/docs/api-reference/backup
   * @param path - The path to where the backup should be saved.
   * @example
   * const db = new MiftahDB(":memory:");
   * db.set("key", "value");
   * db.backup("backup-1.db");
   */
  backup(path: string): void;

  /**
   * Restores the database from a backup file.
   * - https://miftahdb.sqlite3.online/docs/api-reference/restore
   * @param path - The path to the backup file.
   * @example
   * const db = new MiftahDB(":memory:");
   * db.restore("backup-1.db");
   * console.log(db.get("key"));
   */
  restore(path: string): void;
}

/**
 * Represents an item stored in the MiftahDB.
 */
export interface MiftahDBItem {
  /** The stored value as a Buffer. */
  value: Uint8Array;
  /** The expiration timestamp in milliseconds, or null if no expiration. */
  expires_at: number | null;
}
