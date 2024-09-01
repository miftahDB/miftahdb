<div align="center">

<a href="https://miftahdb.sqlite3.online/docs/intro/" target="_blank">
    <img src="https://github.com/user-attachments/assets/9c40c2f7-77de-41d3-b5ba-187d4e01746c" alt="tgram" width="128">
</a>

# MiftahDB

Fast and lightweight key-value database library for Node.js using SQLite.

[![NPM Version](https://img.shields.io/npm/v/miftahdb?label=NPM)](https://www.npmjs.com/package/miftahdb)
[![NPM Type Definitions](https://img.shields.io/npm/types/miftahdb?label=Types)](https://github.com/miftahDB/miftahDB/blob/main/LICENSE)
[![NPM License](https://img.shields.io/npm/l/miftahdb?label=License)](https://app.codacy.com/gh/vwh/sqlite-viewer/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Release](https://github.com/miftahDB/miftahDB/actions/workflows/release.yml/badge.svg)](https://github.com/miftahDB/miftahDB/actions/workflows/release.yml)

<a href="https://miftahdb.sqlite3.online/docs/intro/">
    Documentation
</a>
•
<a href="https://www.npmjs.com/package/miftahdb">
    NPM
</a>
    
</div>

## Features

- Fast and efficient key-value storage
- Support for expiration of keys
- Disk and in-memory database support
- Synchronous API for better performance and concurrency
- Built on top of better-sqlite3 for robust SQLite operations
- Pattern-based key retrieval

## Installation

```bash
npm install miftahdb
```

## Usage

### CommonJS

For CommonJS modules:

```javascript
const MiftahDB = require("miftahdb");
```

### ES Modules

For ES modules:

```javascript
import MiftahDB from "miftahdb";
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

MiftahDB uses a synchronous API, which may seem counterintuitive but actually provides better performance and concurrency than an asynchronous API for most use cases. This is because:

## API Reference

### `Constructor`

Creates a new MiftahDB instance.

- `path`: The path to the SQLite database file, or `:memory:` for an in-memory database.

```javascript
const diskDB = new MiftahDB("database.db");
const memoryDB = new MiftahDB(":memory:");
```

### `Get`

Retrieves a value from the database by its key.

- `key`: The key to look up.
- Returns: The value associated with the key, or null if not found or expired.

```javascript
const value = db.get("user:1234");
if (value) {
  console.log(`User: ${value.name}`);
} else {
  console.log("User not found");
}
```

### `Set`

Sets a value in the database with an optional expiration.

- `key`: The key under which to store the value.
- `value`: The value to store.
- `expiresAt`: Optional expiration date for the key-value pair.

```javascript
// Set a value without expiration
db.set("user:1234", { name: "Ahmad Aburob" });

// Set a value with expiration
const expirationDate = new Date();
expirationDate.setDate(expirationDate.getDate() + 30); // Expires in 30 days
db.set("session:5678", { token: "abc123" }, expirationDate);
```

### `Exists`

Checks if a key exists in the database.

- `key`: The key to check.
- Returns: True if the key exists and hasn't expired, false otherwise.

```javascript
if (db.exists("user:1234")) {
  console.log("User exists");
} else {
  console.log("User not found");
}
```

### `Delete`

Deletes a key-value pair from the database.

- `key`: The key to delete.

```javascript
db.delete("user:1234");
```

### `Rename`

Renames a key in the database.

- `oldKey`: The current key name.
- `newKey`: The new key name.

```javascript
db.rename("user:old_id", "user:new_id");
```

### `Get Expire`

Gets the expiration date of a key.

- `key`: The key to check.
- Returns: The expiration date of the key, or null if the key doesn't exist or has no expiration.

```javascript
const expirationDate = db.getExpire("session:5678");
if (expirationDate) {
  console.log(`Session expires at: ${expirationDate}`);
} else {
  console.log("Session has no expiration or does not exist");
}
```

### `Set Expire`

Sets the expiration date of a key.

- `key`: The key to set the expiration date for.
- `expiresAt`: The expiration date to set.

```javascript
db.setExpire("user:1234", new Date("2028-12-31"));
```

### `Keys`

Retrieves keys matching a pattern.

- `pattern`: Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
- Returns: An array of matching keys.

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

### `Pagination`

Retrieves a paginated list of keys matching a pattern.

- `limit`: The maximum number of keys to return per page.
- `page`: The page number to retrieve (1-based index).
- `pattern`: Optional SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
- Returns: An array of matching keys.

```javascript
// Get the first 5 keys from the database
const firstPage = db.pagination(5, 1);

// Get the first 10 keys with pattern
const firstUsersPage = db.pagination(10, 1, "user:%");

// Get the next 10 keys with pattern
const secondUsersPage = db.pagination(10, 2, "user:%");
```

### `Count`

Counts the number of keys in the database.

- Returns: The number of keys in the database.

```javascript
const count = db.count();
```

### `Count Expired`

Counts the number of expired keys in the database.

- Returns: The number of expired keys in the database.

```javascript
const countExpired = db.countExpired();
```

### `Cleanup`

Removes expired key-value pairs from the database.

```javascript
db.cleanup();
```

### `Vacuum`

Optimizes the database file, reducing its size.

```javascript
db.vacuum();
```

### `Flush`

Ensures all the changes are written to disk.

```javascript
db.flush();
```

### `Execute`

Executes a raw SQL statement and returns the result.

- `sql`: The SQL statement to execute.
- `params`: Optional parameters to bind to the SQL statement.
- Returns: The result of the SQL statement.

```javascript
// Execute a SELECT statement and get results
const rows = db.execute("SELECT * FROM users");
```

### `Get Stats`

Gets the status of the database.

- Returns: A object containing the status of the database.

```javascript
const status = db.getStats();
console.log(status.size);
```

### `Close`

Closes the database connection.

```javascript
db.close();
```

## Supported Value Types

MiftahDB supports various value types:

1. String
2. Number
3. Boolean
4. Array
5. Object
6. Buffer (Binary Data)
7. Date

Example for each type:

```javascript
db.set("string", "Hello!");
db.set("number", 42);
db.set("boolean", true);
db.set("array", [1, 2, 3, 4, 5]);
db.set("object", { name: "Ahmad", age: 15 });
db.set("buffer", Buffer.from("binary data"));
db.set("date", new Date());
```

## Performance Considerations

MiftahDB is designed for high performance:

1. Synchronous API reduces overhead and improves concurrency
2. Built on top of better-sqlite3, one of the fastest SQLite libraries for Node.js
3. Optimized SQLite settings for improved performance
4. In-memory database option for maximum speed

For best performance, consider the following tips:

- Use in-memory databases for temporary or cache-like data
- Regularly run the `cleanup()` and `vacuum()` methods to optimize the database
