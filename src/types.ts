/**
 * The possible types of values that can be stored in MiftahDB.
 * This includes common JavaScript primitives, objects, arrays, Date, Buffer, Uint8Array, and null.
 */
export type MiftahValue =
	| string
	| number
	| boolean
	| Record<string, unknown>
	| unknown[]
	| Date
	| Uint8Array
	| Buffer
	| null;

/**
 * Represents an item as stored internally in the MiftahDB.
 */
export interface MiftahDBItem {
	/** The stored value, serialized as a Uint8Array. */
	value: Uint8Array;
	/** The expiration timestamp in milliseconds (epoch time), or null if the key does not expire. */
	expires_at: number | null;
}

/**
 * Represents the outcome of an operation, which can either be successful with data,
 * or unsuccessful with an error.
 *
 * @template TData The type of data returned on success.
 * @template TError The type of error returned on failure, defaults to `Error`.
 */
export type Result<TData, TError extends Error = Error> =
	| {
			/** Indicates that the operation was successful. */
			success: true;
			/** The data returned by the successful operation. */
			data: TData;
	  }
	| {
			/** Indicates that the operation failed. */
			success: false;
			/** The error object containing details about the failure. */
			error: TError;
	  };

/**
 * Represents the asynchronous outcome of an operation, similar to `Result` but wrapped in a Promise.
 *
 * @template TData The type of data returned on success.
 * @template TError The type of error returned on failure, defaults to `Error`.
 */
export type PromiseResult<TData, TError extends Error = Error> = Promise<Result<TData, TError>>;

/**
 * Interface for the MiftahDB class, defining its public API for key-value storage operations.
 *
 * @template T The default type for values stored and retrieved if not specified by a more specific generic.
 */
export interface IMiftahDB<T extends MiftahValue = MiftahValue> {
	/**
	 * Retrieves a value from the database by its key.
	 *
	 * @template K The expected type of the value being retrieved. Defaults to `T`.
	 * @param {string} key - The key to look up.
	 * @returns {Result<K>} The result of the operation. If successful, `data` contains the value.
	 * @throws {Error} "Key not found, cannot get." if the key does not exist.
	 * @throws {Error} "Key expired, cannot get." if the key exists but has expired (and is subsequently deleted).
	 * @throws {Error} If an issue occurs during value decoding.
	 * @example
	 * const result = db.get<string>("user:1234");
	 * if (result.success) {
	 *   console.log(`User: ${result.data}`);
	 * } else {
	 *   console.log(result.error.message);
	 * }
	 */
	get<K extends T>(key: string): Result<K>; // Changed T to K to match jsdoc

	/**
	 * Sets a value in the database with an optional expiration.
	 * If the key already exists, its value and expiration will be overwritten.
	 *
	 * @template K The type of the value being stored. Must extend `MiftahValue`.
	 * @param {string} key - The key under which to store the value.
	 * @param {K} value - The value to store.
	 * @param {Date | number} [expiresAt] - Optional. The expiration for the key.
	 *                                      Can be a `Date` object representing the absolute expiration time,
	 *                                      or a `number` representing a TTL in milliseconds from now.
	 *                                      If `0` or negative, it's treated as no expiration or already expired.
	 * @returns {Result<boolean>} The result of the operation. `data` is `true` if successful.
	 * @throws {Error} If an issue occurs during value encoding or database interaction.
	 * @example
	 * const setResult = db.set('user:1234', { name: 'Ahmad' });
	 * if (setResult.success) console.log('Key set successfully');
	 *
	 * db.set('tempKey', 'temporary value', 60000); // Expires in 1 minute
	 * db.set('archiveKey', 'data', new Date('2030-12-31'));
	 */
	set<K extends T>(key: string, value: K, expiresAt?: Date | number): Result<boolean>;

	/**
	 * Checks if a key exists in the database and is not expired.
	 *
	 * @param {string} key - The key to check.
	 * @returns {Result<boolean>} The result of the operation. `data` is `true` if the key exists and is valid.
	 * @throws {Error} "Key not found, cannot check exists." if the key does not exist or has expired.
	 * @example
	 * if (db.exists('user:1234').success) {
	 *   console.log('User exists and is valid.');
	 * } else {
	 *   console.log('User does not exist or is expired.');
	 * }
	 */
	exists(key: string): Result<boolean>;

	/**
	 * Deletes a key-value pair from the database.
	 * If the key does not exist, the operation is still considered successful, affecting 0 rows.
	 *
	 * @param {string} key - The key to delete.
	 * @returns {Result<number>} The result of the operation. `data` contains the number of rows affected (0 or 1).
	 * @throws {Error} If a database error occurs during deletion.
	 * @example
	 * const deleteResult = db.delete('user:1234');
	 * if (deleteResult.success) {
	 *   console.log(`Deleted ${deleteResult.data} rows.`);
	 * }
	 */
	delete(key: string): Result<number>;

	/**
	 * Renames a key in the database.
	 * If the old key does not exist, the operation will not affect any rows but won't throw "not found".
	 * If the new key already exists, it will be overwritten.
	 *
	 * @param {string} oldKey - The current key name.
	 * @param {string} newKey - The new key name.
	 * @returns {Result<boolean>} The result of the operation. `data` is `true` if successful.
	 * @throws {Error} If a database error occurs during rename.
	 * @example
	 * if (db.rename('user:old_id', 'user:new_id').success) {
	 *   console.log('Key renamed successfully.');
	 * }
	 */
	rename(oldKey: string, newKey: string): Result<boolean>;

	/**
	 * Sets or updates the expiration date of an existing key.
	 * If the key does not exist, this operation will not create it and may not throw an error but affect 0 rows.
	 *
	 * @param {string} key - The key to set the expiration date for.
	 * @param {Date | number} expiresAt - The expiration date to set.
	 *                                    Can be a `Date` object (absolute time) or `number` (TTL in ms).
	 * @returns {Result<boolean>} The result of the operation. `data` is `true` if successful.
	 * @throws {Error} If a database error occurs or the key doesn't exist to update.
	 *                 (Note: current base implementation does not throw if key not found for setExpire, it just affects 0 rows)
	 * @example
	 * db.setExpire('user:1234', new Date('2028-12-31'));
	 * db.setExpire('sessionData', 3600000); // Expires in 1 hour
	 */
	setExpire(key: string, expiresAt: Date | number): Result<boolean>;

	/**
	 * Gets the expiration date of a key.
	 *
	 * @param {string} key - The key to check.
	 * @returns {Result<Date>} The result of the operation. `data` contains the `Date` object of expiration.
	 * @throws {Error} "Key not found, cannot getExpire." if the key does not exist.
	 * @throws {Error} "Key has no expiration, cannot getExpire." if the key exists but has no expiration set.
	 * @throws {Error} "Key expired, cannot getExpire." if the key was found but is already expired (and then deleted).
	 * @example
	 * const expireDateResult = db.getExpire('session:5678');
	 * if (expireDateResult.success) {
	 *   console.log(`Expiration date: ${expireDateResult.data.toISOString()}`);
	 * }
	 */
	getExpire(key: string): Result<Date>;

	/**
	 * Gets the time-to-live (TTL) of a key in milliseconds.
	 *
	 * @param {string} key - The key to check.
	 * @returns {Result<number | null>} The result of the operation. `data` contains:
	 *          - The remaining TTL in milliseconds if the key has an expiration and is not yet expired.
	 *          - `null` if the key exists but has no expiration (i.e., it persists).
	 * @throws {Error} "Key not found, cannot ttl." if the key does not exist.
	 * @throws {Error} "Key expired, cannot ttl." if the key exists but has expired (and is subsequently deleted).
	 * @example
	 * const ttlResult = db.ttl("session:123");
	 * if (ttlResult.success) {
	 *   if (ttlResult.data === null) console.log("Key persists indefinitely.");
	 *   else console.log(`Key expires in ${ttlResult.data} ms.`);
	 * }
	 */
	ttl(key: string): Result<number | null>;

	/**
	 * Removes the expiration from a key, making it persist indefinitely.
	 *
	 * @param {string} key - The key to make persistent.
	 * @returns {Result<boolean>} The result of the operation. `data` is `true` if the key was found and made persistent (or was already persistent).
	 * @throws {Error} "Key not found, cannot persist." if the key does not exist.
	 * @throws {Error} If a database error occurs.
	 * @example
	 * if (db.persist("user:temp_data").success) {
	 *   console.log("Key now persists.");
	 * }
	 */
	persist(key: string): Result<boolean>;

	/**
	 * Atomically increments the numeric value of a key by a given amount.
	 * If the key does not exist, it is initialized to the `amount`.
	 * If the key exists but its value is expired, it's treated as non-existent (initialized to `amount`).
	 * The original expiration of an existing, non-expired key is preserved.
	 *
	 * @param {string} key - The key whose numeric value to increment.
	 * @param {number} [amount=1] - The amount to increment by. Defaults to 1.
	 * @returns {Result<number>} The result of the operation. `data` contains the new numeric value.
	 * @throws {Error} "Increment amount must be a valid number." if `amount` is not a valid number.
	 * @throws {Error} If the existing value for the key is not a number.
	 * @throws {Error} If a database error occurs during the transaction.
	 * @example
	 * db.set("counter", 10);
	 * db.increment("counter", 5); // counter is now 15
	 * db.increment("new_counter"); // new_counter is now 1
	 */
	increment(key: string, amount?: number): Result<number>;

	/**
	 * Atomically decrements the numeric value of a key by a given amount.
	 * If the key does not exist, it is initialized to `-amount`.
	 * If the key exists but its value is expired, it's treated as non-existent (initialized to `-amount`).
	 * The original expiration of an existing, non-expired key is preserved.
	 *
	 * @param {string} key - The key whose numeric value to decrement.
	 * @param {number} [amount=1] - The amount to decrement by. Defaults to 1.
	 * @returns {Result<number>} The result of the operation. `data` contains the new numeric value.
	 * @throws {Error} "Decrement amount must be a valid number." if `amount` is not a valid number.
	 * @throws {Error} If the existing value for the key is not a number.
	 * @throws {Error} If a database error occurs during the transaction.
	 * @example
	 * db.set("points", 100);
	 * db.decrement("points", 10); // points is now 90
	 * db.decrement("new_score"); // new_score is now -1
	 */
	decrement(key: string, amount?: number): Result<number>;

	/**
	 * Retrieves keys matching a SQL LIKE pattern.
	 * Use `%` to match any sequence of characters (including none) and `_` to match any single character.
	 *
	 * @param {string} [pattern="%"] - Optional SQL LIKE pattern. Defaults to `"%"` (matches all keys).
	 * @returns {Result<string[]>} The result of the operation. `data` contains an array of matching keys.
	 *                            Returns an empty array if no keys match (this is a success case).
	 * @throws {Error} "No keys found, cannot get keys." if no keys match the pattern.
	 *                 (Note: current base implementation throws if no keys are found for this method).
	 * @example
	 * const allKeysResult = db.keys();
	 * const userKeysResult = db.keys('user:%');
	 * const specificKeysResult = db.keys('log_2024_??');
	 */
	keys(pattern?: string): Result<string[]>;

	/**
	 * Retrieves a paginated list of keys matching a SQL LIKE pattern.
	 *
	 * @param {number} limit - The maximum number of keys to return per page.
	 * @param {number} page - The page number to retrieve (1-based index).
	 * @param {string} [pattern="%"] - Optional SQL LIKE pattern. Defaults to `"%"` (matches all keys in the current namespace).
	 * @returns {Result<string[]>} The result of the operation. `data` contains an array of keys for the requested page.
	 *                            Returns an empty array if no keys match or the page is out of bounds (success case).
	 * @throws {Error} "No keys found, cannot get pagination." if no keys are found for the given criteria.
	 *                 (Note: current base implementation throws if no keys are found for this method).
	 * @example
	 * const firstPage = db.pagination(10, 1, 'user:%');
	 * const secondPage = db.pagination(10, 2, 'user:%');
	 */
	pagination(limit: number, page: number, pattern?: string): Result<string[]>;

	/**
	 * Returns an array of keys that have an expiration date falling within the given start and end dates (inclusive).
	 *
	 * @param {Date | number} start - The start of the date range (as `Date` object or epoch milliseconds).
	 * @param {Date | number} end - The end of the date range (as `Date` object or epoch milliseconds).
	 * @param {string} [pattern="%"] - Optional SQL LIKE pattern to filter keys further. Defaults to `"%"`
	 * @returns {Result<string[]>} An array of keys that expired or will expire within the specified range.
	 *                            Returns an empty array if no such keys are found (success case).
	 * @throws {Error} "No keys found, cannot get expiredRange." if no keys match the criteria.
	 *                 (Note: current base implementation throws if no keys are found for this method).
	 * @example
	 * const janExpired = db.expiredRange(new Date("2023-01-01"), new Date("2023-01-31"));
	 */
	expiredRange(start: Date | number, end: Date | number, pattern?: string): Result<string[]>;

	/**
	 * Counts the number of keys in the database, optionally matching a pattern.
	 *
	 * @param {string} [pattern="%"] - Optional SQL LIKE pattern. Defaults to `"%"` (counts all keys in the current namespace).
	 * @returns {Result<number>} The result of the operation. `data` contains the total number of matching keys.
	 * @throws {Error} If a database error occurs.
	 * @example
	 * const totalCount = db.count();
	 * const userCount = db.count('user:%');
	 */
	count(pattern?: string): Result<number>;

	/**
	 * Counts the number of keys that are currently expired, optionally matching a pattern.
	 *
	 * @param {string} [pattern="%"] - Optional SQL LIKE pattern. Defaults to `"%"` (counts all expired keys in the current namespace).
	 * @returns {Result<number>} The result of the operation. `data` contains the number of currently expired keys.
	 * @throws {Error} If a database error occurs.
	 * @example
	 * const expiredUserSessions = db.countExpired('session:user:%');
	 */
	countExpired(pattern?: string): Result<number>;

	/**
	 * Retrieves multiple values from the database by their keys.
	 * This operation is transactional. If any key is not found or is expired, an error is thrown for the entire operation.
	 *
	 * @template K The expected type of the values being retrieved.
	 * @param {string[]} keys - An array of keys to look up.
	 * @returns {Result<K[]>} The result of the operation. `data` contains an array of values in the order corresponding
	 *                       to the input keys (after filtering for found/valid keys by the `get` method).
	 * @throws {Error} "No keys provided, cannot multiGet." if the `keys` array is empty.
	 * @throws {Error} "No keys found, cannot multiGet." if all provided keys were not found or were expired.
	 * @throws {Error} Propagates errors from individual `get` operations (e.g., "Key not found", "Key expired").
	 * @example
	 * const usersResult = db.multiGet<UserType>(['user:123', 'user:456']);
	 * if (usersResult.success) {
	 *   usersResult.data.forEach(user => console.log(user.name));
	 * }
	 */
	multiGet<K extends T>(keys: string[]): Result<K[]>; // Changed T to K

	/**
	 * Sets multiple key-value pairs in the database with optional expirations.
	 * This operation is transactional; if any single set operation fails, all changes are rolled back.
	 *
	 * @template K The type of the values being stored.
	 * @param {Array<{ key: string; value: K; expiresAt?: Date | number }>} entries - An array of entry objects.
	 * @returns {Result<boolean>} The result of the operation. `data` is `true` if all entries were set successfully.
	 * @throws {Error} Propagates errors from individual `set` operations or if the transaction fails.
	 * @example
	 * db.multiSet([
	 *   { key: 'user:1', value: { name: 'Alice' } },
	 *   { key: 'product:10', value: { price: 99 }, expiresAt: 3600000 }
	 * ]);
	 */
	multiSet<K extends T>(
		entries: Array<{ key: string; value: K; expiresAt?: Date | number }>,
	): Result<boolean>;

	/**
	 * Deletes multiple key-value pairs from the database.
	 * This operation is transactional.
	 *
	 * @param {string[]} keys - An array of keys to delete.
	 * @returns {Result<number>} The result of the operation. `data` contains the total number of rows affected.
	 * @throws {Error} "No keys provided, cannot multiDelete." if the `keys` array is empty.
	 * @throws {Error} Propagates errors from individual `delete` operations or if the transaction fails.
	 * @example
	 * const multiDelResult = db.multiDelete(['temp:1', 'temp:2']);
	 * if (multiDelResult.success) console.log(`Deleted ${multiDelResult.data} keys.`);
	 */
	multiDelete(keys: string[]): Result<number>;

	/**
	 * Optimizes the database file by rebuilding it, which can reduce its size and improve performance.
	 * This operation can be time-consuming on large databases.
	 *
	 * @returns {Result<boolean>} The result of the operation. `data` is `true` if successful.
	 * @throws {Error} If a database error occurs during vacuuming.
	 * @example
	 * if (db.vacuum().success) console.log("Database vacuumed successfully.");
	 */
	vacuum(): Result<boolean>;

	/**
	 * Closes the database connection.
	 * Performs a final WAL checkpoint and any configured cleanup before closing.
	 *
	 * @returns {Result<boolean>} The result of the operation. `data` is `true` if successful.
	 * @throws {Error} If an error occurs during closing or pre-close operations.
	 * @example
	 * db.close();
	 */
	close(): Result<boolean>;

	/**
	 * Removes all expired key-value pairs from the database.
	 * This operation only affects keys within the current namespace if one is active.
	 *
	 * @returns {Result<number>} The result of the operation. `data` contains the number of rows (expired keys) removed.
	 * @throws {Error} If a database error occurs during cleanup.
	 * @example
	 * const cleanupResult = db.cleanup();
	 * if (cleanupResult.success) console.log(`Cleaned up ${cleanupResult.data} expired keys.`);
	 */
	cleanup(): Result<number>;

	/**
	 * Removes all key-value pairs from the database.
	 * If a namespace is active, only keys within that namespace are removed.
	 *
	 * @returns {Result<number>} The result of the operation. `data` contains the number of rows (keys) removed.
	 * @throws {Error} If a database error occurs during flush.
	 * @example
	 * const flushResult = db.flush();
	 * if (flushResult.success) console.log(`Flushed ${flushResult.data} keys.`);
	 */
	flush(): Result<number>;

	/**
	 * Executes a raw SQL statement and returns the result.
	 * Use with caution, especially with user-provided input, to avoid SQL injection vulnerabilities.
	 *
	 * @param {string} sql - The SQL statement to execute.
	 * @param {unknown[]} [params=[]] - Optional parameters to bind to the SQL statement.
	 * @returns {Result<unknown[] | import("better-sqlite3").RunResult>} The result of the operation.
	 *          For SELECT queries, `data` is an array of rows.
	 *          For INSERT, UPDATE, DELETE, `data` is a `RunResult` object (from `better-sqlite3`).
	 * @throws {Error} If the SQL is invalid or a database error occurs.
	 * @example
	 * const selectRes = db.execute("SELECT * FROM miftahdb WHERE key LIKE ?", ["user:%"]);
	 * if (selectRes.success) console.log(selectRes.data);
	 */
	execute(sql: string, params?: unknown[]): Result<unknown>; // `unknown` is simpler than RunResult | unknown[] union

	/**
	 * Asynchronously backups the current in-memory or disk-based database to a specified file path.
	 * The entire database content is serialized.
	 *
	 * @param {string} path - The file path where the backup should be saved.
	 * @returns {PromiseResult<boolean>} A promise resolving to the result of the operation. `data` is `true` on success.
	 * @throws {Error} If an error occurs during database serialization or file writing.
	 * @example
	 * async function performBackup() {
	 *   const backupResult = await db.backup("my_database_backup.db");
	 *   if (backupResult.success) console.log("Backup successful!");
	 * }
	 */
	backup(path: string): PromiseResult<boolean>;

	/**
	 * Asynchronously restores the database from a backup file.
	 * This replaces the current database content with the content from the backup.
	 *
	 * @param {string} path - The path to the backup file to restore from.
	 * @returns {PromiseResult<boolean>} A promise resolving to the result of the operation. `data` is `true` on success.
	 * @throws {Error} If an error occurs during file reading or database deserialization/reinitialization.
	 * @example
	 * async function performRestore() {
	 *   const restoreResult = await db.restore("my_database_backup.db");
	 *   if (restoreResult.success) console.log("Restore successful!");
	 * }
	 */
	restore(path: string): PromiseResult<boolean>;

	/**
	 * Creates a new MiftahDB instance that is bound to a specific namespace.
	 * All keys set or retrieved through this namespaced instance will be automatically prefixed.
	 *
	 * @param {string} name - The name of the namespace (e.g., "users", "products").
	 * @returns {IMiftahDB<T>} A new `IMiftahDB` instance operating within the specified namespace.
	 * @example
	 * const usersDB = db.namespace("users");
	 * usersDB.set("alice", { email: "alice@example.com" }); // Actually sets "users:alice"
	 * const alice = usersDB.get("alice"); // Retrieves from "users:alice"
	 *
	 * const postsDB = usersDB.namespace("posts"); // Nested: "users:posts:some_post_id"
	 * postsDB.set("welcome", { title: "Hello World" });
	 */
	namespace(name: string): IMiftahDB<T>;
}

/*
 Represents the PRAGMA statements that can be used to configure the database.
 */
export type DBOptions = Partial<{
	[K in keyof typeof defaultDBOptions]: K extends "cacheSize" | "mmapSize"
		? number
		: (typeof defaultDBOptions)[K];
}>;

/**
 * Default configuration options for the MiftahDB instance.
 * These values are used if not overridden in the constructor.
 */
export const defaultDBOptions = {
	/** Determines the journal mode (default: `"WAL"`). */
	journalMode: "WAL" as "DELETE" | "TRUNCATE" | "PERSIST" | "WAL" | "MEMORY",
	/** Controls the database's synchronization mode (default: `"NORMAL"`). */
	synchronousMode: "NORMAL" as "OFF" | "NORMAL" | "FULL" | "EXTRA",
	/** Specifies where temporary tables and indices are stored (default: `"MEMORY"`). */
	tempStoreMode: "MEMORY" as "DEFAULT" | "MEMORY" | "FILE",
	/** The suggested maximum N-page cache size for the database (default: `-64000`, which is 64MB). */
	cacheSize: -64000,
	/** The maximum size of the memory-mapped I/O region (default: `30000000000`, approx 28GB). SQLite will use less if not needed. */
	mmapSize: 30000000000,
	/** Determines the database locking mode (default: `"NORMAL"`). */
	lockingMode: "NORMAL" as "NORMAL" | "EXCLUSIVE",
	/** Configures the auto-vacuum behavior (default: `"OFF"`). */
	autoVacuumMode: "OFF" as "OFF" | "FULL" | "INCREMENTAL",
	/** Automatically runs `cleanup()` when the database is closed (default: `false`). */
	autoCleanupOnClose: false as boolean,
	/** Automatically closes the database connection when the Node.js process exits (default: `true`). */
	autoCloseOnExit: true as boolean,
} as const;
