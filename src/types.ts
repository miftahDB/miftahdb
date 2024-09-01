/**
 * Represents the possible types of values that can be stored in MiftahDB.
 */
export type KeyValue = string | number | boolean | object | Buffer | null;

/**
 * Interface for the MiftahDB class, defining its public methods.
 */
export interface IMiftahDB<T extends KeyValue = KeyValue> {
  /**
   * Retrieves a value from the database by its key.
   * @param key - The key to look up.
   * @returns The value associated with the key, or null if not found or expired.
   * @example
   * const value = db.get('user:1234');
   */
  get(key: string): T | null;

  /**
   * Sets a value in the database with an optional expiration.
   * @param key - The key under which to store the value.
   * @param value - The value to store.
   * @param expiresAt - Optional expiration date for the key-value pair.
   * @example
   * db.set('user:1234', { name: 'John Doe' }, new Date('2023-12-31'));
   */
  set(key: string, value: T, expiresAt?: Date): void;

  /**
   * Gets the expiration date of a key.
   * @param key - The key to check.
   * @returns The expiration date of the key, or null if the key doesn't exist or has no expiration.
   * @example
   * const expirationDate = db.getExpire('user:1234');
   */
  getExpire(key: string): Date | null;

  /**
   * Sets the expiration date of a key.
   * @param key - The key to set the expiration date for.
   * @param expiresAt - The expiration date to set.
   * @example
   * db.setExpire('user:1234', new Date('2028-12-31'));
   */
  setExpire(key: string, expiresAt: Date): void;

  /**
   * Checks if a key exists in the database.
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
   * @param key - The key to delete.
   * @example
   * db.delete('user:1234');
   */
  delete(key: string): void;

  /**
   * Renames a key in the database.
   * @param oldKey - The current key name.
   * @param newKey - The new key name.
   * @example
   * db.rename('user:old_id', 'user:new_id');
   */
  rename(oldKey: string, newKey: string): void;

  /**
   * Retrieves keys matching a pattern.
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
   * @returns The number of keys in the database.
   * @example
   * const count = db.count();
   */
  count(): number;

  /**
   * Counts the number of expired keys in the database.
   * @returns The number of expired keys in the database.
   * @example
   * const countExpired = db.countExpired();
   */
  countExpired(): number;

  /**
   * Removes expired key-value pairs from the database.
   * @example
   * db.cleanup();
   */
  cleanup(): void;

  /**
   * Optimizes the database file, reducing its size.
   * @example
   * db.vacuum();
   */
  vacuum(): void;

  /**
   * Closes the database connection.
   * @example
   * db.close();
   */
  close(): void;

  /**
   * Ensures all the changes written to disk.
   * @example
   * db.flush();
   */
  flush(): void;

  /**
   * Executes a raw SQL statement and returns the result.
   * @param sql - The SQL statement to execute. Be cautious with raw SQL to avoid SQL injection vulnerabilities.
   * @param params - Optional parameters to bind to the SQL statement.
   * @returns The result of the SQL query. If the statement is a `SELECT` query, it returns the query result. Otherwise, it returns the database instance.
   * @example
   * // Execute a SELECT statement and get results
   * const rows = db.execute('SELECT * FROM users');
   *
   * // Execute an INSERT or UPDATE statement
   * db.execute('INSERT INTO users (name) VALUES (?)', ['John Doe']);
   */
  execute(sql: string, params?: any[]): void;

  /**
   * Gets the status of the database.
   * @returns A object containing the status of the database.
   * @example
   * const status = db.getStats();
   */
  getStats(): {
    totalRecords: number;
    expiredRecords: number;
    dbSize: number;
    dbName: string;
  };
}

/**
 * Represents an item stored in the MiftahDB.
 */
export interface MiftahDBItem {
  /** The stored value as a Buffer. */
  value: Buffer;
  /** The expiration timestamp in milliseconds, or null if no expiration. */
  expires_at: number | null;
}
