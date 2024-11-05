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
- [Error Handling](#error-handling)
- [API Reference](#api-reference)
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
- Result type handling ( no try-catch blocks )
- **Supports both Bun and Node.js environments**

## Installation

```bash
# With NPM
npm install miftahdb

# With Bun
bun install miftahdb
```

## Usage

```javascript
// Node runtime
import { MiftahDB } from "miftahdb";

// For Bun runtime
import { MiftahDB } from "miftahdb/bun";
```

### Example Usage

```javascript
// Create a new disk-based database instance
const db = new MiftahDB("database.db");

// Use the database
db.set("user:1234", { name: "Ahmad Aburob" });
const user = db.get("user:1234");
console.log(user);
```

## Synchronous API

**MiftahDB** uses a synchronous API, which may seem counterintuitive but actually provides better performance and concurrency than an asynchronous API for most use cases.

## Error Handling

**MiftahDB** uses result types to handle errors. The result type includes a boolean indicating whether the operation was successful and the data returned by the operation, or an error if the operation failed.

```javascript
const result = db.get("user:1234");
if (result.success) {
  console.log(`User: ${result.data}`);
} else {
  console.log(result.error.message);
}
```

## API Reference

### `Constructor`

Creates a new **MiftahDB** instance.

- **Parameters**:
  - `path`: The path to the database file. Defaults to ":memory:" if not provided.

```javascript
// New MiftahDB instance with disk-based database
const db = new MiftahDB("test.db");

// New MiftahDB instance with in-memory database
const db = new MiftahDB(":memory:");
```

---

### `Get`

Retrieves a value from the database by its key.

- **Parameters**:
  - `key`: The key to look up.
- **Returns**:
  - The result of the operation, includes a boolean indicating whether the operation was successful and the value, or an error if the operation failed.

```typescript
const result = db.get<User>("user:1234");
if (result.success) {
  console.log(`User: ${result.data.name}`);
} else {
  console.log(result.error.message);
}
```

---

### `Set`

Sets a value in the database with an optional expiration.

- **Parameters**:
  - `key`: The key under which to store the value.
  - `value`: The value to store.
  - `expiresAt`: Optional expiration date as a Date object or number of milliseconds.
- **Returns**:
  - The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.

```typescript
// Full example with result type handling
const result = db.set("user:1234", { name: "Ahmad" });
if (result.success) {
  console.log("Key set successfully");
} else {
  console.log(result.error.message);
}

// Set a value with expiration in milliseconds
db.set("key", "value", 90000);

// Set a value with Date object expiration
db.set("key", "value", new Date("2030-12-31"));
```

---

### `Exists`

Checks if a key exists in the database.

- **Parameters**:
  - `key`: The key to check.
- **Returns**:
  - The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.

```javascript
if (db.exists("user:12345").success) {
  console.log("User exists");
} else {
  console.log("User does not exist");
}
```

---

### `Delete`

Deletes a key-value pair from the database.

- **Parameters**:
  - `key`: The key to delete.
- **Returns**:
  - The result of the operation, includes a number indicating the number of rows affected by the operation or an error if the operation failed.

```javascript
const result = db.delete("user:1234");
if (result.success) {
  console.log(`Deleted ${result.data} rows`);
} else {
  console.log(result.error.message);
}
```

---

### `Rename`

Renames a key in the database.

- **Parameters**:
  - `oldKey`: The current key name.
  - `newKey`: The new key name.
- **Returns**:
  - The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.

```javascript
if (db.rename("user:old_id", "user:new_id").success) {
  console.log("Key renamed successfully");
} else {
  console.log(result.error.message);
}
```

---

### `Get Expire`

Gets the expiration date of a key.

- **Parameters**:
  - `key`: The key to check.
- **Returns**:
  - The result of the operation, includes the expiration date of the key or an error if the operation failed.

```javascript
const result = db.getExpire("session:5678");
if (result.success) {
  console.log(`Expiration date: ${result.data}`);
} else {
  console.log(result.error.message);
}
```

---

### `Set Expire`

Sets or update the expiration date of a key.

- **Parameters**:
  - `key`: The key to set the expiration date for.
  - `expiresAt`: The expiration date to set as Date object or number of milliseconds.
- **Returns**:
  - The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.

```javascript
// Date object expiration
if (db.setExpire("user:1234", new Date("2028-12-31")).success) {
  console.log("Expiration date set successfully");
} else {
  console.log(result.error.message);
}

// Number of milliseconds expiration
if (db.setExpire("user:1234", 90000).success) {
  console.log("Expiration date set successfully");
} else {
  console.log(result.error.message);
}
```

---

### `Keys`

Retrieves keys matching a pattern.

- **Parameters**:
  - `pattern`: Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
- **Returns**:
  - The result of the operation, includes an array of matching keys or an error if the operation failed.

```javascript
// Get all keys with result type handling
const result = db.keys();
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.message);
}

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
  - The result of the operation, includes an array of keys that match the pattern or an error if the operation failed.

```javascript
// Get the first 5 keys from the database with result type handling
const result = db.pagination(5, 1);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.message);
}

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
  - The result of the operation, includes the number of keys in the database or an error if the operation failed.

```javascript
// Get the total number of keys with result type handling
const result = db.count();
if (result.success) {
  console.log(`Total keys: ${result.data}`);
} else {
  console.log(result.error.message);
}

// Get the number of keys matching "user:%"
const userCount = db.count("user:%");
```

---

### `Count Expired`

Counts the number of expired keys in the database.

- **Parameters**:
  - `pattern`: Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
- **Returns**:
  - The result of the operation, includes the number of expired keys in the database or an error if the operation failed.

```javascript
// Get the total number of expired keys with result type handling
const result = db.countExpired();
if (result.success) {
  console.log(`Total expired keys: ${result.data}`);
} else {
  console.log(result.error.message);
}

// Get the number of expired keys matching "user:%"
const userCountExpired = db.countExpired("user:%");
```

---

### `Multi Get`

Retrieves multiple values from the database by their keys.

- **Parameters**:
  - `keys`: An array of keys to look up.
- **Returns**:
  - The result of the operation, includes an object with keys and their corresponding values or an error if the operation failed.

```javascript
const result = db.multiGet(["user:1234", "user:5678"]);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.message);
}
```

---

### `Multi Set`

Sets multiple key-value pairs in the database with optional expirations.

- **Parameters**:
  - `entries`: An array of objects containing key, value, and optional expiresAt date as a Date object or number of milliseconds.
- **Returns**:
  - The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.

```javascript
const result = db.multiSet([
  {
    key: "user:1234",
    value: { name: "Ahmad" },
    expiresAt: new Date("2025-12-31"),
  },
  { key: "user:5678", value: { name: "Fatima" }, expiresAt: 86400000 },
  { key: "user:7890", value: { name: "Mohamed" } },
]);

if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.message);
}
```

---

### `Multi Delete`

Deletes multiple key-value pairs from the database.

- **Parameters**:
  - `keys`: An array of keys to delete.
- **Returns**:
  - The result of the operation, includes the number of rows affected by the operation or an error if the operation failed.

```javascript
const result = db.multiDelete(["user:1234", "user:5678"]);
if (result.success) {
  console.log(`Deleted ${result.data} rows`);
} else {
  console.log(result.error.message);
}
```

---

### `Cleanup`

Removes expired key-value pairs from the database.

- **Returns**:
  - The result of the operation, includes the number of rows affected by the operation or an error if the operation failed.

```javascript
const result = db.cleanup();
if (result.success) {
  console.log(`Cleaned up ${result.data} rows`);
} else {
  console.log(result.error.message);
}
```

---

### `Vacuum`

Optimizes the database file, reducing its size.

- **Returns**:
  - The result of the operation, includes a boolean indicating whether the operation was successful or an error if the operation failed.

```javascript
if (db.vacuum().success) {
  console.log("Database vacuumed successfully");
} else {
  console.log(result.error.message);
}
```

---

### `Flush`

Ensures all the changes are written to disk.

- **Returns**:
  - The result of the operation, includes the number of rows affected by the operation or an error if the operation failed.

```javascript
const result = db.flush();
if (result.success) {
  console.log(`Flushed ${result.data} rows`);
} else {
  console.log(result.error.message);
}
```

### `Namespace`

Creates a namespaced database instance.

- **Parameters**:
  - `name`: The name of the namespace.
- **Returns**:
  - A new database instance with the namespace applied.

```javascript
// Create a new database instance
const db = new MiftahDB(":memory:");

// Make a namespaced database instance
const users = db.namespace("users");
const posts = db.namespace("posts");
const comments = db.namespace("comments");

// Set/Get a value with a namespace
users.set("852335", { name: "Ahmad" });
console.log(users.get("852335"));

// Will count the keys only on the "users" namespace only
users.count();

// Will remove expired keys only on the "users" namespace only
users.cleanup();

// Will remove all keys only on the "users" namespace only
users.flush();
```

---

### `Execute`

Executes a raw SQL statement and returns the result.

- **Parameters**:
  - `sql`: The SQL statement to execute.
  - `params`: Optional parameters to bind to the SQL statement.
- **Returns**:
  - The result of the operation, includes the result of the SQL query or an error if the operation failed.

```javascript
// Execute a SELECT statement and get results
const result = db.execute("SELECT * FROM miftahdb WHERE key LIKE ? LIMIT 5;", [
  "%",
]);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.message);
}
```

---

### `Backup`

Backups the database to a file asynchronously.

- **Parameters**:
  - `path`: The path to where the backup should be saved.

```javascript
const db = new MiftahDB(":memory:");

db.set("key", "value");

const result = await db.backup("backup-1.db");
if (result.success) {
  console.log("Backup completed successfully");
} else {
  console.log(result.error.message);
}
```

---

### `Restore`

Restores the database from a backup file asynchronously.

- **Parameters**:
  - `path`: The path to the backup file.

```javascript
const db = new MiftahDB(":memory:");

const result = await db.restore("backup-1.db");
if (result.success) {
  console.log("Restore completed successfully");
} else {
  console.log(result.error.message);
}

console.log(db.get("key"));
```

---

### `Close`

Closes the database connection.

```javascript
db.close();
```

---

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
const result = db.get<User>("user:1234");
if (result.success) {
  console.log(`User: ${result.data.name}, Age: ${result.data.age}`);
} else {
  console.log(result.error.message);
}
```

## Performance Considerations

**MiftahDB** is designed for high performance:

1. Synchronous API reduces overhead and improves concurrency
2. Optimized SQLite settings for improved performance
3. In-memory database option for maximum speed

For best performance, consider the following tips:

- Use in-memory databases for temporary or cache-like data
- Regularly run the `cleanup()` and `vacuum()` methods to optimize the database
