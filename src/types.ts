/**
 * The possible types of values that can be stored in MiftahDB.
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
   * @returns The result of the operation, includes a boolean indicating whether the operation was successful and the value, or an error if the operation failed.
   * @example
   * const result = db.get<string>("user:1234");
   * if (result.success) {
   *   console.log(`User: ${result.data}`);
   * } else {
   *   console.log(result.error.message);
   * }
   */
  get<K extends T>(key: string): Result<T>;

  /**
   * Sets a value in the database with an optional expiration.
   * - https://miftahdb.sqlite3.online/docs/api-reference/set
   * @param key - The key under which to store the value.
   * @param value - The value to store.
   * @param expiresAt - Optional expiration date as a Date object or number of milliseconds.
   * @returns The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.
   * @example
   * // Full example with result type handling
   * const result = db.set('user:1234', { name: 'Ahmad' });
   * if (result.success) {
   *   console.log('Key set successfully');
   * } else {
   *   console.log(result.error.message);
   * }
   *
   * // Set a value with expiration in milliseconds
   * db.set('key', 'value', 90000);
   *
   * // Set a value with Date object expiration
   * db.set('key', 'value', new Date('2030-12-31'));
   */
  set<K extends T>(
    key: string,
    value: K,
    expiresAt?: Date | number
  ): Result<boolean>;

  /**
   * Checks if a key exists in the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/exists
   * @param key - The key to check.
   * @returns The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.
   * @example
   * if (db.exists('user:1234').success) {
   *   console.log('User exists');
   * } else {
   *   console.log('User does not exist');
   * }
   */
  exists(key: string): Result<boolean>;

  /**
   * Deletes a key-value pair from the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/delete
   * @param key - The key to delete.
   * @returns The result of the operation, includes a number indicating the number of rows affected by the operation or an error if the operation failed.
   * @example
   * const result = db.delete('user:1234');
   * if (result.success) {
   *   console.log(`Deleted ${result.data} rows`);
   * }
   */
  delete(key: string): Result<number>;

  /**
   * Renames a key in the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/rename
   * @param oldKey - The current key name.
   * @param newKey - The new key name.
   * @returns The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.
   * @example
   * if (db.rename('user:old_id', 'user:new_id').success) {
   *   console.log('Key renamed successfully');
   * }
   */
  rename(oldKey: string, newKey: string): Result<boolean>;

  /**
   * Sets or update the expiration date of a key.
   * - https://miftahdb.sqlite3.online/docs/api-reference/setexpire
   * @param key - The key to set the expiration date for.
   * @param expiresAt - The expiration date to set as a Date object or number of milliseconds.
   * @returns The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.
   * @example
   * // Date object expiration
   * if (db.setExpire('user:1234', new Date('2028-12-31')).success) {
   *   console.log('Expiration date set successfully');
   * }
   *
   * // Number of milliseconds expiration
   * if (db.setExpire('user:1234', 90000).success) {
   *   console.log('Expiration date set successfully');
   * }
   */
  setExpire(key: string, expiresAt: Date | number): Result<boolean>;

  /**
   * Gets the expiration date of a key.
   * - https://miftahdb.sqlite3.online/docs/api-reference/getexpire
   * @param key - The key to check.
   * @returns The result of the operation, includes the expiration date of the key or an error if the operation failed.
   * @example
   * const result = db.getExpire('user:1234');
   * if (result.success) {
   *   console.log(`Expiration date: ${result.data}`);
   * } else {
   *   console.log(result.error.message);
   * }
   */
  getExpire(key: string): Result<Date>;

  /**
   * Retrieves keys matching a pattern.
   * - https://miftahdb.sqlite3.online/docs/api-reference/keys
   * @param {string} [pattern="%"] - Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
   *                                 Use "%" to match any sequence of characters and "_" to match any single character.
   * @returns The result of the operation, includes an array of matching keys or an error if the operation failed.
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
  keys(pattern?: string): Result<string[]>;

  /**
   * Retrieves a paginated list of keys matching a pattern.
   * - https://miftahdb.sqlite3.online/docs/api-reference/pagination
   * @param limit - The maximum number of keys to return per page.
   * @param page - The page number to retrieve (1-based index).
   * @param pattern - Optional SQL LIKE pattern to match keys. Use "%" to match any sequence of characters and "_" to match any single character.
   * @returns The result of the operation, includes an array of keys that match the pattern or an error if the operation failed.
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
  pagination(limit: number, page: number, pattern?: string): Result<string[]>;

  /**
   * Counts the number of keys in the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/count
   * @param pattern - Optional SQL LIKE pattern to match keys. Use "%" to match any sequence of characters and "_" to match any single character.
   * @returns The result of the operation, includes the number of keys in the database or an error if the operation failed.
   * @example
   * // Get the total number of keys
   * const count = db.count();
   * if (result.success) {
   *   console.log(`Total keys: ${result.data}`);
   * }
   *
   * // Get the number of keys matching "user:%"
   * const userCount = db.count('user:%');
   */
  count(pattern?: string): Result<number>;

  /**
   * Counts the number of expired keys in the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/countexpired
   * @param pattern - Optional SQL LIKE pattern to match keys. Use "%" to match any sequence of characters and "_" to match any single character.
   * @returns The result of the operation, includes the number of expired keys in the database or an error if the operation failed.
   * @example
   * // Get the total number of expired keys
   * const countExpired = db.countExpired();
   * if (result.success) {
   *   console.log(`Total expired keys: ${result.data}`);
   * }
   *
   * // Get the number of expired keys matching "user:%"
   * const userCountExpired = db.countExpired('user:%');
   */
  countExpired(pattern?: string): Result<number>;

  /**
   * Retrieves multiple values from the database by their keys.
   * - https://miftahdb.sqlite3.online/docs/api-reference/multiget
   * @param keys - An array of keys to look up.
   * @returns The result of the operation, includes an object with keys and their corresponding values or an error if the operation failed.
   * @example
   * const result = db.multiGet(['user:1234', 'user:5678']);
   */
  multiGet<K extends T>(keys: string[]): Result<Record<string, T | null>>;

  /**
   * Sets multiple key-value pairs in the database with optional expirations.
   * - https://miftahdb.sqlite3.online/docs/api-reference/multiset
   * @param entries - An array of objects containing key, value, and optional expiresAt date as a Date object or number of milliseconds.
   * @returns The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.
   * @example
   * db.multiSet([
   *   { key: 'user:1234', value: { name: 'Ahmad' }, expiresAt: new Date('2025-12-31') },
   *   { key: 'user:5678', value: { name: 'Fatima' }, expiresAt: 86400000 },
   *   { key: 'user:7890', value: { name: 'Mohamed' } }
   * ]);
   */
  multiSet<K extends T>(
    entries: Array<{ key: string; value: K; expiresAt?: Date | number }>
  ): Result<boolean>;

  /**
   * Deletes multiple key-value pairs from the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/multidelete
   * @param keys - An array of keys to delete.
   * @returns The result of the operation, includes the number of rows affected by the operation or an error if the operation failed.
   * @example
   * const result = db.multiDelete(['user:1234', 'user:5678']);
   * if (result.success) {
   *   console.log(`Deleted ${result.data} rows`);
   * }
   */
  multiDelete(keys: string[]): Result<number>;

  /**
   * Optimizes the database file, reducing its size.
   * - https://miftahdb.sqlite3.online/docs/api-reference/vacuum
   * @returns The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.
   * @example
   * db.vacuum();
   */
  vacuum(): Result<boolean>;

  /**
   * Closes the database connection.
   * - https://miftahdb.sqlite3.online/docs/api-reference/close
   * @returns The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.
   * @example
   * db.close();
   */
  close(): Result<boolean>;

  /**
   * Removes expired key-value pairs from the database.
   * - https://miftahdb.sqlite3.online/docs/api-reference/cleanup
   * @returns The result of the operation, includes the number of rows affected by the operation or an error if the operation failed.
   * @example
   * const result = db.cleanup();
   * if (result.success) {
   *   console.log(`Cleaned up ${result.data} rows`);
   * }
   */
  cleanup(): Result<number>;

  /**
   * Ensures all the changes written to disk.
   * - https://miftahdb.sqlite3.online/docs/api-reference/flush
   * @returns The result of the operation, includes the number of rows affected by the operation or an error if the operation failed.
   * @example
   * const result = db.flush();
   * if (result.success) {
   *   console.log(`Flushed ${result.data} rows`);
   * }
   */
  flush(): Result<number>;

  /**
   * Executes a raw SQL statement and returns the result.
   * - https://miftahdb.sqlite3.online/docs/api-reference/execute
   * @param sql - The SQL statement to execute. Be cautious with raw SQL to avoid SQL injection vulnerabilities.
   * @param params - Optional parameters to bind to the SQL statement.
   * @returns The result of the operation, includes the result of the SQL query or an error if the operation failed.
   * @example
   * // Execute a SELECT statement and get results
   * const result = db.execute("SELECT * FROM miftahdb WHERE key LIKE ? LIMIT 5;", ["%"]);
   *
   * // Execute an DELETE statement
   * db.execute("DELETE FROM miftahdb WHERE key LIKE ?", ["user:1234"]);
   */
  execute(sql: string, params?: unknown[]): Result<unknown>;

  /**
   * Backups the database to a file.
   * - https://miftahdb.sqlite3.online/docs/api-reference/backup
   * @param path - The path to where the backup should be saved.
   * @example
   * const db = new MiftahDB(":memory:");
   * db.set("key", "value");
   * await db.backup("backup-1.db");
   */
  backup(path: string): Promise<void>;

  /**
   * Restores the database from a backup file.
   * - https://miftahdb.sqlite3.online/docs/api-reference/restore
   * @param path - The path to the backup file.
   * @example
   * const db = new MiftahDB(":memory:");
   * await db.restore("backup-1.db");
   * console.log(db.get("key"));
   */
  restore(path: string): Promise<void>;

  /**
   * Creates a namespaced database instance.
   * - https://miftahdb.sqlite3.online/docs/api-reference/namespace
   * @param name - The name of the namespace.
   * @returns A new database instance with the namespace applied.
   * @example
   * const users = db.namespace("users");
   * users.set("123", "value1");
   * console.log(users.get("123"));
   */
  namespace(name: string): IMiftahDB<T>;
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

/**
 * Represents the result of a function that returns a value or an error.
 */
export type Result<TData, TError extends Error = Error> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      error: TError;
    };
