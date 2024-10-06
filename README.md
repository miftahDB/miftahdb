<div align="center">

<a href="https://miftahdb.sqlite3.online/docs/intro/" target="_blank">
    <img src="https://github.com/user-attachments/assets/9c40c2f7-77de-41d3-b5ba-187d4e01746c" alt="tgram" width="128">
</a>

# MiftahDB

Fast and lightweight key-value database library.

[![NPM Version](https://img.shields.io/npm/v/miftahdb?label=NPM)](https://www.npmjs.com/package/miftahdb)
[![NPM Type Definitions](https://img.shields.io/npm/types/miftahdb?label=Types)](https://github.com/miftahDB/miftahDB/blob/main/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/d18m/miftahdb?label=Downloads)](https://www.npmjs.com/package/miftahdb)
[![NPM License](https://img.shields.io/npm/l/miftahdb?label=License)](https://app.codacy.com/gh/vwh/sqlite-viewer/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

[![Release](https://github.com/miftahDB/miftahDB/actions/workflows/release.yml/badge.svg)](https://github.com/miftahDB/miftahDB/actions/workflows/release.yml)
[![Test-Bun](https://github.com/miftahDB/miftahDB/actions/workflows/test-bun.yml/badge.svg)](https://github.com/miftahDB/miftahDB/actions/workflows/test-bun.yml)
[![Test-Node](https://github.com/miftahDB/miftahDB/actions/workflows/test-node.yml/badge.svg)](https://github.com/miftahDB/miftahDB/actions/workflows/test-node.yml)
[![Lint](https://github.com/miftahDB/miftahDB/actions/workflows/tsc.yml/badge.svg)](https://github.com/miftahDB/miftahDB/actions/workflows/tsc.yml)

<a href="https://miftahdb.sqlite3.online/docs/intro/">
    Documentation
</a>
•
<a href="https://www.npmjs.com/package/miftahdb">
    NPM
</a>
•
<a href="https://github.com/miftahDB/benchmarks">
    Benchmarks
</a>
</div>

## Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#usage)
- [Synchronous API](#synchronous-api)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Supported Value Types](#supported-value-types)
- [TypeScript Typing & Generics](#typescript-typing--generics)
- [Pattern Matching](#pattern-matching)
- [Performance Considerations](#performance-considerations)

## Features

- Fast and efficient key-value storage
- Support for expiration of keys
- Disk and in-memory database support
- Synchronous API for better performance and concurrency
- Built on top of `better-sqlite3` for optimal Node.js performance
- Utilizes `bun:sqlite` for seamless Bun integration
- Pattern-based key retrieval
- **Supports both Bun and Node.js environments**

## Installation

```bash
# With npm
npm install miftahdb

# With bun
bun add miftahdb
```

## Usage

```javascript
// For Node
import { MiftahDB } from "miftahdb";

// For Bun
import { MiftahDB } from "miftahdb/bun";
```

### Example Usage

```javascript
// Create a new disk-based database instance
const db = new MiftahDB("database.db");

// Or create an in-memory database
const memDB = new MiftahDB(":memory:");

// Use the database
db.set("user:1234", { name: "Ahmad Aburob" });
const user = db.get("user:1234");
console.log(user);
```

## Synchronous API

**MiftahDB** uses a synchronous API, which may seem counterintuitive but actually provides better performance and concurrency than an asynchronous API for most use cases.

## API Reference

### `Constructor`

Creates a new **MiftahDB** instance.

- **Parameters**:
  - `path`: The path to the database file, or `:memory:` for an in-memory database.

```javascript
const diskDB = new MiftahDB("database.db");
const memoryDB = new MiftahDB(":memory:");
```

---

### `Get`

Retrieves a value from the database by its key.

- **Parameters**:
  - `key`: The key to look up.
- **Returns**:
  - The value associated with the key, or null if not found or expired.

```typescript
const value = db.get<User>("user:1234");
if (value) {
  console.log(`User: ${value.name}`);
} else {
  console.log("User not found");
}
```

---

### `Set`

Sets a value in the database with an optional expiration.

- **Parameters**:
  - `key`: The key under which to store the value.
  - `value`: The value to store.
  - `expiresAt`: Optional expiration date for the key-value pair.

```javascript
// Set a value without expiration
db.set("user:1234", { name: "Ahmad Aburob" });

// Set a value with expiration
db.set("session:5678", "data", new Date("2025-12-31"));
```

---

### `Exists`

Checks if a key exists in the database.

- **Parameters**:
  - `key`: The key to check.
- **Returns**:
  - True if the key exists and hasn't expired, false otherwise.

```javascript
if (db.exists("user:1234")) {
  console.log("User exists");
} else {
  console.log("User not found");
}
```

---

### `Delete`

Deletes a key-value pair from the database.

- **Parameters**:
  - `key`: The key to delete.

```javascript
db.delete("user:1234");
```

---

### `Rename`

Renames a key in the database.

- **Parameters**:
  - `oldKey`: The current key name.
  - `newKey`: The new key name.

```javascript
db.rename("user:old_id", "user:new_id");
```

---

### `Get Expire`

Gets the expiration date of a key.

- **Parameters**:
  - `key`: The key to check.
- **Returns**:
  - The expiration date of the key, or null if the key doesn't exist or has no expiration.

```javascript
const expirationDate = db.getExpire("session:5678");
if (expirationDate) {
  console.log(`Session expires at: ${expirationDate}`);
} else {
  console.log("Session has no expiration or does not exist");
}
```

---

### `Set Expire`

Sets the expiration date of a key.

- **Parameters**:
  - `key`: The key to set the expiration date for.
  - `expiresAt`: The expiration date to set.

```javascript
db.setExpire("user:1234", new Date("2028-12-31"));
```

---

### `Keys`

Retrieves keys matching a pattern.

- **Parameters**:
  - `pattern`: Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
- **Returns**:
  - An array of matching keys.

```javascript
// Get all keys
const allKeys = db.keys();

// Get keys starting with "user:"
const userKeys = db.keys("user:%");

// Get keys with exactly 5 characters
const fiveCharKeys = db.keys("_____");

// Get keys starting with "log", followed by exactly two characters, and ending with any number of characters
const logKeys = db.keys("log__:%");
```

---

### `Pagination`

Retrieves a paginated list of keys matching a pattern.

- **Parameters**:
  - `limit`: The maximum number of keys to return per page.
  - `page`: The page number to retrieve (1-based index).
  - `pattern`: Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
- **Returns**:
  - An array of matching keys.

```javascript
// Get the first 5 keys from the database
const firstPage = db.pagination(5, 1);

// Get the first 10 keys with pattern
const firstUsersPage = db.pagination(10, 1, "user:%");

// Get the next 10 keys with pattern
const secondUsersPage = db.pagination(10, 2, "user:%");
```

---

### `Count`

Counts the number of keys in the database.

- **Parameters**:
  - `pattern`: Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
- **Returns**:
  - The number of keys in the database.

```javascript
// Get the total number of keys
const count = db.count();

// Get the number of keys matching "user:%"
const userCount = db.count("user:%");
```

---

### `Count Expired`

Counts the number of expired keys in the database.

- **Parameters**:
  - `pattern`: Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
- **Returns**:
  - The number of expired keys in the database.

```javascript
// Get the total number of expired keys
const countExpired = db.countExpired();

// Get the number of expired keys matching "user:%"
const userCountExpired = db.countExpired("user:%");
```

---

### `Multi Get`

Retrieves multiple values from the database by their keys.

- **Parameters**:
  - `keys`: An array of keys to look up.
- **Returns**:
  - An object with keys and their corresponding values, or empty object if keys are not found or expired.

```javascript
const values = db.multiGet(["user:1234", "user:5678"]);
```

---

### `Multi Set`

Sets multiple key-value pairs in the database with optional expirations.

- **Parameters**:
  - `entries`: An array of objects containing key, value, and optional expiresAt.

```javascript
db.multiSet([
  {
    key: "user:1234",
    value: { name: "Ahmad" },
    expiresAt: new Date("2023-12-31"),
  },
  { key: "user:5678", value: { name: "Fatima" } },
]);
```

---

### `Multi Delete`

Deletes multiple key-value pairs from the database.

- **Parameters**:
  - `keys`: An array of keys to delete.

```javascript
db.multiDelete(["user:1234", "user:5678"]);
```

---

### `Cleanup`

Removes expired key-value pairs from the database.

```javascript
db.cleanup();
```

---

### `Vacuum`

Optimizes the database file, reducing its size.

```javascript
db.vacuum();
```

---

### `Flush`

Ensures all the changes are written to disk.

```javascript
db.flush();
```

### `Namespace`

Creates a namespaced database instance.

- **Parameters**:
  - `name`: The name of the namespace.
- **Returns**:
  - A new database instance with the namespace applied.

```javascript
const db = new MiftahDB(":memory:");

// Create a new database instance with a namespace
const users = db.namespace("users");
const posts = db.namespace("posts");
const comments = db.namespace("comments");

// Set a value with a namespace
users.set("852335", { name: "Ahmad" });
console.log(users.get("852335"));

// Other examples:
// Will count the keys only on the "users" namespace
users.count();

// Will remove expired keys only on the "users" namespace
users.cleanup();

// Will remove all keys only on the "users" namespace
users.flush();
```

---

### `Execute`

Executes a raw SQL statement and returns the result.

- **Parameters**:
  - `sql`: The SQL statement to execute.
  - `params`: Optional parameters to bind to the SQL statement.
- **Returns**:
  - The result of the SQL statement.

```javascript
// Execute a SELECT statement and get results
const rows = db.execute("SELECT * FROM miftahdb WHERE key LIKE ? LIMIT 5;", [
  "%",
]);
```

---

### `Backup`

Backups the database to a file.

- **Parameters**:
  - `path`: The path to where the backup should be saved.

```javascript
const db = new MiftahDB(":memory:");
db.set("key", "value");
db.backup("backup-1.db");
```

---

### `Restore`

Restores the database from a backup file.

- **Parameters**:
  - `path`: The path to the backup file.

```javascript
const db = new MiftahDB(":memory:");
db.restore("backup-1.db");
console.log(db.get("key"));
```

---

### `Close`

Closes the database connection.

```javascript
db.close();
```

---

## Error Handling

```javascript
// Node
import { SqliteError } from "miftahdb";

// Bun
// import { SQLiteError } from "miftahdb/bun";

try {
  db.execute("WRONG SQL STATEMENT");
} catch (err) {
  if (err instanceof SqliteError) {
    console.log(err.message);
  }
}
```

## Supported Value Types

**MiftahDB** supports various value types:

| No  | Type                     |
| --- | ------------------------ |
| 1   | String                   |
| 2   | Number                   |
| 3   | Boolean                  |
| 4   | Array                    |
| 5   | Record (Object)          |
| 6   | Date                     |
| 7   | Buffer (Binary Data)     |
| 8   | Uint8Array (Binary Data) |
| 9   | Null                     |

**Example for each type**:

```javascript
db.set("String", "Hello!");
db.set("Number", 42);
db.set("Boolean", true);
db.set("Array", [1, 2, 3, 4, 5]);
db.set("Record", { name: "Ahmad", age: 15 });
db.set("Date", new Date());
db.set("Buffer", Buffer.from([1, 2, 3, 4, 5]));
db.set("Uint8Array", new Uint8Array([1, 2, 3, 4, 5]));
db.set("Null", null);
```

## TypeScript Typing & Generics

**MiftahDB** is fully typed with TypeScript, allowing you to leverage TypeScript's static type checking and type inference. You can use generic types to specify the type of values stored and retrieved from the database.

When retrieving values from **MiftahDB**, you can define the type of the stored value for better type safety:

```typescript
type User = {
  name: string;
  age: number;
  email: string;
};

// Set a value with a known structure
db.set<User>("user:1234", {
  name: "Ahmad",
  age: 15,
  email: "ahmad@example.com",
});

// Retrieve the value with TypeScript typing
const value = db.get<User>("user:1234");
if (value) {
  console.log(`User: ${value.name}, Age: ${value.age}`);
} else {
  console.log("User not found");
}
```

## Pattern Matching

**MiftahDB** provides powerful pattern matching capabilities for working with keys. You can use patterns in multiple methods, such as:

- `db.keys(pattern)`
- `db.pagination(limit, page, pattern)`
- `db.count(pattern)`
- `db.countExpired(pattern)`

The pattern syntax follows SQL-like wildcard matching:

- `%`: Matches any sequence of characters (including none).
- `_`: Matches exactly one character.

```javascript
// Match keys starting with "user:"
db.keys("user:%");

// Match keys ending with "osama"
db.keys("%osama");

// Match keys starting with "osama" and ending with any number of characters
db.keys("osama%");

// Match keys that are exactly 3 characters long
db.keys("___");

// Combine patterns: Match keys starting with "log", followed by exactly two characters, and ending with any number of characters
db.keys("log__:%");
```

## Performance Considerations

**MiftahDB** is designed for high performance:

1. Synchronous API reduces overhead and improves concurrency
2. Optimized SQLite settings for improved performance
3. In-memory database option for maximum speed

For best performance, consider the following tips:

- Use in-memory databases for temporary or cache-like data
- Regularly run the `cleanup()` and `vacuum()` methods to optimize the database
