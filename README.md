<div align="center">

<a href="https://miftahdb.sqlite3.online/docs/intro/" target="_blank">
    <img src="https://github.com/user-attachments/assets/9c40c2f7-77de-41d3-b5ba-187d4e01746c" alt="MiftahDB Logo" width="148">
</a>

# MiftahDB

**Fast, Lightweight, Synchronous Key-Value Database for Node.js & Bun**

[![NPM Version](https://img.shields.io/npm/v/miftahdb?label=NPM&style=flat-square)](https://www.npmjs.com/package/miftahdb)
[![NPM Type Definitions](https://img.shields.io/npm/types/miftahdb?label=Types&style=flat-square)](https://github.com/miftahDB/miftahDB/blob/main/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/d18m/miftahdb?label=Downloads&style=flat-square)](https://www.npmjs.com/package/miftahdb)
[![NPM License](https://img.shields.io/npm/l/miftahdb?label=License&style=flat-square)](https://github.com/miftahDB/miftahDB/blob/main/LICENSE)

[![Release Workflow](https://img.shields.io/github/actions/workflow/status/miftahDB/miftahDB/release.yml?branch=main&label=Release&style=flat-square)](https://github.com/miftahDB/miftahDB/actions/workflows/release.yml)
[![Bun Tests](https://img.shields.io/github/actions/workflow/status/miftahDB/miftahDB/test-bun.yml?branch=main&label=Bun%20Tests&style=flat-square)](https://github.com/miftahDB/miftahDB/actions/workflows/test-bun.yml)
[![Node.js Tests](https://img.shields.io/github/actions/workflow/status/miftahDB/miftahDB/test-node.yml?branch=main&label=Node.js%20Tests&style=flat-square)](https://github.com/miftahDB/miftahDB/actions/workflows/test-node.yml)
[![Lint](https://img.shields.io/github/actions/workflow/status/miftahDB/miftahDB/lint.yml?branch=main&label=Lint&style=flat-square)](https://github.com/miftahDB/miftahDB/actions/workflows/lint.yml)
[![Format](https://img.shields.io/github/actions/workflow/status/miftahDB/miftahDB/format.yml?branch=main&label=Format&style=flat-square)](https://github.com/miftahDB/miftahDB/actions/workflows/format.yml)

<br>

<p>
  <a href="https://www.npmjs.com/package/miftahdb"><strong>NPM</strong></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://github.com/miftahDB/benchmarks"><strong>Benchmarks</strong></a>
</p>

</div>

---

MiftahDB offers a high-performance, synchronous key-value storage solution, leveraging the speed of SQLite. It's designed for ease of use in both Node.js (via `better-sqlite3`) and Bun (via `bun:sqlite`) environments, providing a consistent API with robust error handling and TypeScript support.

## Table of Contents

- [✨ Features](#-features)
- [🚀 Installation](#-installation)
- [💡 Usage](#-usage)
  - [Basic Example](#basic-example)
  - [Synchronous API](#synchronous-api)
  - [Error Handling](#error-handling)
- [📚 API Reference](#-api-reference)
  - [Constructor](#constructor)
  - [Core Operations](#core-operations)
    - [`get`](#get)
    - [`set`](#set)
    - [`exists`](#exists)
    - [`delete`](#delete)
    - [`rename`](#rename)
  - [Expiration Management](#expiration-management)
    - [`setExpire`](#setexpire)
    - [`getExpire`](#getexpire)
    - [`ttl`](#ttl)
    - [`persist`](#persist)
  - [Numeric Operations](#numeric-operations)
    - [`increment`](#increment)
    - [`decrement`](#decrement)
  - [Key Enumeration & Querying](#key-enumeration--querying)
    - [`keys`](#keys)
    - [`pagination`](#pagination)
    - [`expiredRange`](#expiredrange)
  - [Counting](#counting)
    - [`count`](#count)
    - [`countExpired`](#countexpired)
  - [Bulk Operations](#bulk-operations)
    - [`multiGet`](#multiget)
    - [`multiSet`](#multiset)
    - [`multiDelete`](#multidelete)
  - [Database Management](#database-management)
    - [`cleanup`](#cleanup)
    - [`vacuum`](#vacuum)
    - [`flush`](#flush)
    - [`close`](#close)
  - [Advanced](#advanced)
    - [`namespace`](#namespace)
    - [`execute`](#execute)
    - [`backup`](#backup)
    - [`restore`](#restore)
- [📦 Supported Value Types](#-supported-value-types)
- [🔍 Pattern Matching](#-pattern-matching)
- [🔷 TypeScript Typing & Generics](#-typescript-typing--generics)
- [⚡ Performance Considerations](#-performance-considerations)

## ✨ Features

- **Fast & Efficient:** Optimized for speed with SQLite as the backend.
- **Key Expiration:** Built-in support for automatic key expiration.
- **Storage Options:** Supports both disk-based and in-memory databases.
- **Synchronous API:** Designed for simplicity and performance in synchronous workflows.
- **Dual Runtime Support:**
  - Node.js: Powered by `better-sqlite3`.
  - Bun: Utilizes native `bun:sqlite`.
- **Pattern Matching:** Retrieve keys based on SQL `LIKE` patterns.
- **Result-Oriented Error Handling:** No `try-catch` needed; methods return a `Result` object.
- **Namespacing:** Isolate data within logical namespaces.
- **Atomic Numeric Operations:** `increment` and `decrement` values safely.
- **TypeScript Native:** Fully typed for a better development experience.

## 🚀 Installation

```bash
# With NPM
npm install miftahdb

# With Bun
bun add miftahdb
```

## 💡 Usage

Import based on your runtime:

```javascript
// For Node.js runtime
import { MiftahDB } from "miftahdb";

// For Bun runtime
import { MiftahDB } from "miftahdb/bun";
```

### Basic Example

```javascript
// Create or open a database file
const db = new MiftahDB("my_app_data.db");

// Set a key-value pair
const setResult = db.set("user:1", { name: "Ahmad Aburob", city: "Amman" });
if (!setResult.success) {
  console.error("Failed to set key:", setResult.error.message);
}

// Get a value
const getResult = db.get("user:1");
if (getResult.success) {
  console.log("User Data:", getResult.data);
  // => User Data: { name: "Ahmad Aburob", city: "Amman" }
} else {
  console.error("Failed to get key:", getResult.error.message);
}

// Close the database (optional, auto-closes on exit by default)
db.close();
```

### Synchronous API

MiftahDB employs a synchronous API. While often associated with potential blocking in Node.js, for many local database operations, this approach can reduce overhead and simplify code, leading to better performance and concurrency characteristics for common use cases.

### Error Handling

MiftahDB uses a **Result Type** pattern for error handling, eliminating the need for `try-catch` blocks for predictable operational outcomes. Each method returns an object indicating success or failure:

```javascript
const result = db.get("non_existent_key");

if (result.success) {
  // This block won't be reached if the key doesn't exist
  console.log("Data:", result.data);
} else {
  // Handle the error
  console.error("Operation failed:", result.error.message);
  // => Operation failed: Key not found, cannot get.
}
```

A `Result` object has the shape:
`{ success: true, data: YourDataType }` or `{ success: false, error: Error }`.

## 📚 API Reference

### Constructor

`new MiftahDB(path?: string, options?: DBOptions)`

Creates a new MiftahDB instance.

- **Parameters**:

  - `path` (`string`, optional): Path to the database file. Defaults to `":memory:"` for an in-memory database.
  - `options` (`DBOptions`, optional): Configuration for the SQLite connection.
    - `journalMode` (`string`): Journal mode (default: `"WAL"`). Options: `"DELETE"`, `"TRUNCATE"`, `"PERSIST"`, `"WAL"`, `"MEMORY"`.
    - `synchronousMode` (`string`): Synchronization mode (default: `"NORMAL"`). Options: `"OFF"`, `"NORMAL"`, `"FULL"`, `"EXTRA"`.
    - `tempStoreMode` (`string`): Temporary table storage (default: `"MEMORY"`). Options: `"DEFAULT"`, `"MEMORY"`, `"FILE"`.
    - `cacheSize` (`number`): Suggested N-page cache size (default: `-64000`, approx. 64MB).
    - `mmapSize` (`number`): Max memory-map size (default: `30000000000`, approx. 28GB).
    - `lockingMode` (`string`): Locking mode (default: `"NORMAL"`). Options: `"NORMAL"`, `"EXCLUSIVE"`.
    - `autoVacuumMode` (`string`): Auto-vacuum behavior (default: `"OFF"`). Options: `"OFF"`, `"FULL"`, `"INCREMENTAL"`.
    - `autoCleanupOnClose` (`boolean`): Run `cleanup()` on `close()` (default: `false`).
    - `autoCloseOnExit` (`boolean`): Close DB on process exit (default: `true`).

- **Example Usage**:

  ```javascript
  // In-memory database with default options
  const memDB = new MiftahDB();

  // Disk-based database
  const fileDB = new MiftahDB("path/to/your.db");

  // Custom configuration
  const customDB = new MiftahDB("custom.db", {
    journalMode: "WAL",
    synchronousMode: "FULL",
    cacheSize: -128000, // Approx. 128MB
  });
  ```

---

### Core Operations

#### `get`

`get<K extends T>(key: string): Result<K>`

Retrieves a value from the database by its key.

- **Parameters**:
  - `key` (`string`): The key to look up.
- **Returns**: `Result<K>` - The operation's result. On success, `data` holds the value.
- **Throws (via Result.error)**:
  - `"Key not found, cannot get."`: If the key doesn't exist.
  - `"Key expired, cannot get."`: If the key existed but was expired (and is then deleted).
- **Example**:
  ```typescript
  type User = { id: number; name: string };
  const userResult = db.get<User>("user:123");
  if (userResult.success) {
    console.log(userResult.data.name);
  } else {
    console.error(userResult.error.message);
  }
  ```

#### `set`

`set<K extends T>(key: string, value: K, expiresAt?: Date | number): Result<boolean>`

Sets a value in the database, optionally with an expiration time.

- **Parameters**:
  - `key` (`string`): The key for the value.
  - `value` (`K`): The value to store.
  - `expiresAt` (`Date | number`, optional): Expiration time.
    - `Date`: Absolute expiration time.
    - `number`: TTL in milliseconds from now.
- **Returns**: `Result<boolean>` - `data` is `true` on success.
- **Example**:
  ```javascript
  db.set("session:xyz", { userId: 100 }, 3600000); // Expires in 1 hour
  db.set("config", { theme: "dark" }); // No expiration
  ```

#### `exists`

`exists(key: string): Result<boolean>`

Checks if a key exists and is not expired.

- **Parameters**:
  - `key` (`string`): The key to check.
- **Returns**: `Result<boolean>` - `data` is `true` if the key exists and is valid.
- **Throws (via Result.error)**:
  - `"Key not found, cannot check exists."`: If the key doesn't exist or is expired.
- **Note**: Faster than `get()` for simple existence checks due to a more optimized SQL query.
- **Example**:
  ```javascript
  if (db.exists("cache:item").success) {
    console.log("Item is in cache.");
  }
  ```

#### `delete`

`delete(key: string): Result<number>`

Deletes a key-value pair.

- **Parameters**:
  - `key` (`string`): The key to delete.
- **Returns**: `Result<number>` - `data` is the number of rows affected (0 or 1).
- **Example**:
  ```javascript
  const delResult = db.delete("old_key");
  if (delResult.success) console.log(`Deleted ${delResult.data} items.`);
  ```

#### `rename`

`rename(oldKey: string, newKey: string): Result<boolean>`

Renames a key. If the new key exists, it's overwritten.

- **Parameters**:
  - `oldKey` (`string`): The current key name.
  - `newKey` (`string`): The new key name.
- **Returns**: `Result<boolean>` - `data` is `true` on success.
- **Example**:
  ```javascript
  db.rename("temp_name", "permanent_name");
  ```

---

### Expiration Management

#### `setExpire`

`setExpire(key: string, expiresAt: Date | number): Result<boolean>`

Sets or updates the expiration time for an existing key.

- **Parameters**:
  - `key` (`string`): The key to update.
  - `expiresAt` (`Date | number`): New expiration (absolute `Date` or TTL `number` in ms).
- **Returns**: `Result<boolean>` - `data` is `true` if successful.
- **Throws (via Result.error)**: If the key doesn't exist, the operation might not change anything or could error depending on internal behavior (current base implementation doesn't throw for "not found" here but affects 0 rows).
- **Example**:
  ```javascript
  db.setExpire("active_session", new Date(Date.now() + 60 * 60 * 1000)); // 1 hour from now
  ```

#### `getExpire`

`getExpire(key: string): Result<Date>`

Gets the absolute expiration date of a key.

- **Parameters**:
  - `key` (`string`): The key to check.
- **Returns**: `Result<Date>` - `data` is the `Date` object of expiration.
- **Throws (via Result.error)**:
  - `"Key not found, cannot getExpire."`
  - `"Key has no expiration, cannot getExpire."`
  - `"Key expired, cannot getExpire."` (if found but already expired)
- **Example**:
  ```javascript
  const expResult = db.getExpire("my_token");
  if (expResult.success)
    console.log(`Token expires at: ${expResult.data.toLocaleString()}`);
  ```

#### `ttl`

`ttl(key: string): Result<number | null>`

Gets the remaining time-to-live (TTL) of a key in milliseconds.

- **Parameters**:
  - `key` (`string`): The key to check.
- **Returns**: `Result<number | null>` -
  - `data` is `number`: Remaining TTL in milliseconds.
  - `data` is `null`: Key exists but has no expiration (persists).
- **Throws (via Result.error)**:
  - `"Key not found, cannot ttl."`
  - `"Key expired, cannot ttl."` (if found but already expired)
- **Example**:
  ```javascript
  const ttlResult = db.ttl("session_data");
  if (ttlResult.success) {
    if (ttlResult.data === null) console.log("Session persists.");
    else console.log(`Session expires in ${ttlResult.data / 1000} seconds.`);
  }
  ```

#### `persist`

`persist(key: string): Result<boolean>`

Removes the expiration from a key, making it persist indefinitely.

- **Parameters**:
  - `key` (`string`): The key to make persistent.
- **Returns**: `Result<boolean>` - `data` is `true` if the key was found and made persistent.
- **Throws (via Result.error)**:
  - `"Key not found, cannot persist."`
- **Example**:
  ```javascript
  db.persist("important_config");
  ```

---

### Numeric Operations

#### `increment`

`increment(key: string, amount: number = 1): Result<number>`

Atomically increments the numeric value of a key. Initializes to `amount` if key doesn't exist or is expired. Preserves existing valid expiration.

- **Parameters**:
  - `key` (`string`): The key to increment.
  - `amount` (`number`, optional): Amount to increment by. Defaults to `1`.
- **Returns**: `Result<number>` - `data` is the new numeric value.
- **Throws (via Result.error)**:
  - `"Increment amount must be a valid number."`
  - If the existing value is not a number.
- **Example**:
  ```javascript
  db.set("pageViews", 100);
  const newViews = db.increment("pageViews"); // => { success: true, data: 101 }
  db.increment("newCounter", 5); // => { success: true, data: 5 }
  ```

#### `decrement`

`decrement(key: string, amount: number = 1): Result<number>`

Atomically decrements the numeric value of a key. Initializes to `-amount` if key doesn't exist or is expired. Preserves existing valid expiration.

- **Parameters**:
  - `key` (`string`): The key to decrement.
  - `amount` (`number`, optional): Amount to decrement by. Defaults to `1`.
- **Returns**: `Result<number>` - `data` is the new numeric value.
- **Throws (via Result.error)**:
  - `"Decrement amount must be a valid number."`
  - If the existing value is not a number.
- **Example**:
  ```javascript
  db.set("stockLevel", 50);
  const newLevel = db.decrement("stockLevel", 5); // => { success: true, data: 45 }
  db.decrement("score", 10); // => { success: true, data: -10 }
  ```

---

### Key Enumeration & Querying

#### `keys`

`keys(pattern: string = "%"): Result<string[]>`

Retrieves keys matching a SQL `LIKE` pattern.

- **Parameters**:
  - `pattern` (`string`, optional): SQL `LIKE` pattern (e.g., `"user:%"`, `"__log"`). Defaults to `"%"` (all keys).
- **Returns**: `Result<string[]>` - `data` is an array of matching keys. Returns an empty array if no matches (success case).
- **Throws (via Result.error)**:
  - `"No keys found, cannot get keys."` (Note: current base implementation throws this if result set is empty).
- **Example**:
  ```javascript
  const allKeys = db.keys().data;
  const userKeys = db.keys("user:%").data;
  ```

#### `pagination`

`pagination(limit: number, page: number, pattern: string = "%"): Result<string[]>`

Retrieves a paginated list of keys matching a SQL `LIKE` pattern.

- **Parameters**:
  - `limit` (`number`): Max keys per page.
  - `page` (`number`): Page number (1-based).
  - `pattern` (`string`, optional): SQL `LIKE` pattern. Defaults to `"%"`
- **Returns**: `Result<string[]>` - `data` is an array of keys for the page. Empty if no matches or page out of bounds.
- **Throws (via Result.error)**:
  - `"No keys found, cannot get pagination."` (Note: current base implementation throws this if result set is empty for the page).
- **Example**:
  ```javascript
  const pageOne = db.pagination(10, 1, "product:*").data;
  ```

#### `expiredRange`

`expiredRange(start: Date | number, end: Date | number, pattern: string = "%"): Result<string[]>`

Retrieves keys whose expiration falls within a specified date range.

- **Parameters**:
  - `start` (`Date | number`): Start of the date range (Date object or epoch ms).
  - `end` (`Date | number`): End of the date range.
  - `pattern` (`string`, optional): SQL `LIKE` pattern. Defaults to `"%"`
- **Returns**: `Result<string[]>` - `data` is an array of keys. Empty if no matches.
- **Throws (via Result.error)**:
  - `"No keys found, cannot get expiredRange."` (Note: current base implementation throws this if result set is empty).
- **Example**:
  ```javascript
  const expiringSoon = db.expiredRange(Date.now(), Date.now() + 86400000).data; // Expiring in next 24h
  ```

---

### Counting

#### `count`

`count(pattern: string = "%"): Result<number>`

Counts keys, optionally matching a pattern.

- **Parameters**:
  - `pattern` (`string`, optional): SQL `LIKE` pattern. Defaults to `"%"`
- **Returns**: `Result<number>` - `data` is the total number of matching keys.
- **Note**: Faster than `keys(pattern).data.length`.
- **Example**:
  ```javascript
  const totalItems = db.count().data;
  const imageCount = db.count("image:%").data;
  ```

#### `countExpired`

`countExpired(pattern: string = "%"): Result<number>`

Counts currently expired keys, optionally matching a pattern.

- **Parameters**:
  - `pattern` (`string`, optional): SQL `LIKE` pattern. Defaults to `"%"`
- **Returns**: `Result<number>` - `data` is the number of expired keys.
- **Example**:
  ```javascript
  const totalExpired = db.countExpired().data;
  ```

---

### Bulk Operations

#### `multiGet`

`multiGet<K extends T>(keys: string[]): Result<K[]>`

Retrieves multiple values. Transactional: fails if any key is not found/expired.

- **Parameters**:
  - `keys` (`string[]`): Array of keys to look up.
- **Returns**: `Result<K[]>` - `data` is an array of values.
- **Throws (via Result.error)**:
  - `"No keys provided, cannot multiGet."`
  - `"No keys found, cannot multiGet."`
  - Errors from individual `get` operations.
- **Example**:
  ```typescript
  const items = db.multiGet<Product>(["prod:1", "prod:2"]).data;
  ```

#### `multiSet`

`multiSet<K extends T>(entries: Array<{ key: string; value: K; expiresAt?: Date | number }>): Result<boolean>`

Sets multiple key-value pairs. Transactional.

- **Parameters**:
  - `entries` (`Array`): Array of `{ key, value, expiresAt? }` objects.
- **Returns**: `Result<boolean>` - `data` is `true` if all set successfully.
- **Example**:
  ```javascript
  db.multiSet([
    { key: "a", value: 1 },
    { key: "b", value: "two", expiresAt: 5000 },
  ]);
  ```

#### `multiDelete`

`multiDelete(keys: string[]): Result<number>`

Deletes multiple keys. Transactional.

- **Parameters**:
  - `keys` (`string[]`): Array of keys to delete.
- **Returns**: `Result<number>` - `data` is the total number of rows affected.
- **Throws (via Result.error)**:
  - `"No keys provided, cannot multiDelete."`
- **Example**:
  ```javascript
  db.multiDelete(["temp:1", "temp:2"]);
  ```

---

### Database Management

#### `cleanup`

`cleanup(): Result<number>`

Removes all expired key-value pairs from the database.

- **Returns**: `Result<number>` - `data` is the number of rows (expired keys) removed.
- **Note**: Run periodically to reclaim space and optimize.
- **Example**:
  ```javascript
  const cleanedCount = db.cleanup().data;
  console.log(`Cleaned ${cleanedCount} expired items.`);
  ```

#### `vacuum`

`vacuum(): Result<boolean>`

Optimizes the database file by rebuilding it, reducing size and fragmentation.

- **Returns**: `Result<boolean>` - `data` is `true` if successful.
- **Note**: Can be time-consuming on large databases.
- **Example**:
  ```javascript
  db.vacuum();
  ```

#### `flush`

`flush(): Result<number>`

Removes all key-value pairs from the database (or current namespace).

- **Returns**: `Result<number>` - `data` is the number of rows removed.
- **Example**:
  ```javascript
  db.flush(); // Clears the entire database (or current namespace)
  ```

#### `close`

`close(): Result<boolean>`

Closes the database connection. Performs pre-close operations like WAL checkpoint and cleanup (if configured).

- **Returns**: `Result<boolean>` - `data` is `true` if successful.
- **Example**:
  ```javascript
  db.close();
  ```

---

### Advanced

#### `namespace`

`namespace(name: string): IMiftahDB<T>`

Creates a new MiftahDB instance bound to a specific namespace. Keys are automatically prefixed.

- **Parameters**:
  - `name` (`string`): The namespace identifier.
- **Returns**: `IMiftahDB<T>` - A new, namespaced MiftahDB instance.
- **Example**:

  ```javascript
  const usersDB = db.namespace("users");
  usersDB.set("john", { email: "john@example.com" }); // Key becomes "users:john"

  const userPostsDB = usersDB.namespace("posts");
  userPostsDB.set("post1", { title: "My First Post" }); // Key becomes "users:posts:post1"
  ```

#### `execute`

`execute(sql: string, params: unknown[] = []): Result<unknown>`

Executes a raw SQL statement. Use with caution.

- **Parameters**:
  - `sql` (`string`): The SQL statement.
  - `params` (`unknown[]`, optional): Parameters to bind.
- **Returns**: `Result<unknown>`
  - For `SELECT`, `data` is an array of rows.
  - For `INSERT/UPDATE/DELETE`, `data` is a `RunResult` object (from `better-sqlite3`).
- **Example**:
  ```javascript
  const result = db.execute(
    "SELECT COUNT(*) as c FROM miftahdb WHERE key LIKE ?",
    ["config:%"]
  );
  if (result.success) console.log(result.data[0].c);
  ```

#### `backup`

`backup(path: string): PromiseResult<boolean>`

Asynchronously backs up the database to a file.

- **Parameters**:
  - `path` (`string`): File path for the backup.
- **Returns**: `PromiseResult<boolean>` - `data` is `true` on success.
- **Example**:
  ```javascript
  await db.backup("mydb.backup.db");
  ```

#### `restore`

`restore(path: string): PromiseResult<boolean>`

Asynchronously restores the database from a backup file, replacing current content.

- **Parameters**:
  - `path` (`string`): Path to the backup file.
- **Returns**: `PromiseResult<boolean>` - `data` is `true` on success.
- **Example**:
  ```javascript
  await db.restore("mydb.backup.db");
  ```

---

## 📦 Supported Value Types

MiftahDB can store various JavaScript data types. Internally, values are serialized using `msgpack-lite` or stored as raw binary data.

| No. | Type                  | Storable? | Notes                                                        |
| --- | --------------------- | :-------: | ------------------------------------------------------------ |
| 1   | String                |    ✅     |                                                              |
| 2   | Number                |    ✅     | Includes `NaN`, `Infinity`, `-Infinity`.                     |
| 3   | Boolean               |    ✅     |                                                              |
| 4   | Array                 |    ✅     | Elements must also be storable.                              |
| 5   | Record (Plain Object) |    ✅     | Values must also be storable.                                |
| 6   | Date                  |    ✅     | Stored as MessagePack timestamp; retrieved as `Date` object. |
| 7   | Buffer (Node.js)      |    ✅     | Stored as raw binary with a type marker.                     |
| 8   | Uint8Array            |    ✅     | Stored as raw binary with a type marker.                     |
| 9   | Null                  |    ✅     |                                                              |
| 10  | `undefined`           |    ⚠️     | Stored as `null`.                                            |

**Example for core types:**

```javascript
db.set("myString", "Hello Miftah!");
db.set("myNumber", 123.45);
db.set("myBoolean", true);
db.set("myArray", [1, "two", { three: 3 }]);
db.set("myRecord", { user: "guest", score: 0 });
db.set("myDate", new Date());
db.set("myBuffer", Buffer.from("binary data"));
db.set("myUint8Array", new Uint8Array([0, 1, 2]));
db.set("myNull", null);
```

## 🔍 Pattern Matching

Several MiftahDB methods support SQL `LIKE` patterns for key matching: `keys()`, `pagination()`, `count()`, `countExpired()`, `expiredRange()`.

- `%`: Matches any sequence of zero or more characters.
- `_`: Matches exactly one character.

**Examples**:

```javascript
// Keys starting with "session:"
const sessionKeys = db.keys("session:%").data;

// Keys ending with "_log"
const logKeys = db.keys("%_log").data;

// Keys with exactly 5 characters
const fiveCharKeys = db.keys("_____").data;

// Keys like "user:???:data" (e.g., user:123:data)
const specificUserKeys = db.keys("user:___:data").data;
```

## 🔷 TypeScript Typing & Generics

MiftahDB is written in TypeScript and provides strong typing for all methods. Use generics to specify the expected type of your data:

```typescript
type UserProfile = {
  id: string;
  username: string;
  email?: string;
};

// Set a strongly-typed value
db.set<UserProfile>("user:profile:jane", {
  id: "jane_doe",
  username: "JaneD",
});

// Retrieve with type safety
const profileResult = db.get<UserProfile>("user:profile:jane");
if (profileResult.success) {
  console.log(profileResult.data.username); // Autocompletion and type checking!
}

// Multi-Set with types
db.multiSet<UserProfile | null>([
  // Can store different types or null
  { key: "user:profile:john", value: { id: "john_d", username: "JohnD" } },
  { key: "user:profile:guest", value: null }, // Storing null explicitly
]);

// Multi-Get with types
const profilesResult = db.multiGet<UserProfile>([
  "user:profile:jane",
  "user:profile:john",
]);
if (profilesResult.success) {
  profilesResult.data.forEach((profile) => console.log(profile.id));
}
```

## ⚡ Performance Considerations

MiftahDB is built for speed:

1.  **Synchronous Operations:** Reduces Promise/async overhead for local DB access.
2.  **Optimized SQLite Backend:** Leverages `better-sqlite3` (Node.js) and `bun:sqlite` (Bun), both known for high performance.
3.  **Efficient Queries:** Uses specific SQL queries optimized for key-value operations (e.g., `EXISTS` for `exists()`).
4.  **In-Memory Mode:** Offers `":memory:"` for maximum throughput for caches or temporary data.

**Tips for Best Performance:**

- **In-Memory for Speed:** Use `:memory:` databases for transient data or caches where persistence across restarts isn't required.
- **Batch Operations:** Utilize `multiSet()`, `multiGet()`, and `multiDelete()` for multiple items to reduce overhead of individual calls.
- **Periodic Maintenance:**
  - Run `cleanup()` regularly to remove expired keys and free up space.
  - Run `vacuum()` occasionally (especially after large deletions) to compact the database file and improve query performance. This can be a blocking operation.
- **Appropriate PRAGMAs:** While defaults are good, advanced users can tweak SQLite PRAGMA settings via the constructor options for specific workloads.
- **Avoid Over-Fetching:** Use `exists()` instead of `get()` if you only need to check for presence. Use `count()` instead of `keys().length`.

---

Contributions, issues, and feature requests are welcome!
