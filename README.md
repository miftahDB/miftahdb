# MiftahDB

MiftahDB is a fast and lightweight key-value database library for Node.js using SQLite.

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

### Installation

Install `miftahdb` using npm:

```bash
npm install miftahdb
```

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
const db = new MiftahDB("path/to/database.sqlite");

// Or create an in-memory database
const memDB = new MiftahDB(":memory:");

// Use the database
db.set("user:1234", { name: "John Doe" });
const user = db.get("user:1234");
console.log(user); // { name
```

## Synchronous API

MiftahDB uses a synchronous API, which may seem counterintuitive but actually provides better performance and concurrency than an asynchronous API for most use cases. This is because:

## API Reference

### `constructor`

Creates a new MiftahDB instance.

- `path`: The path to the SQLite database file, or `:memory:` for an in-memory database.

```javascript
const diskDB = new MiftahDB("path/to/database.sqlite");
const memoryDB = new MiftahDB(":memory:");
```

### `get`

Retrieves a value from the database by its key.

- `key`: The key to look up.
- Returns: The value associated with the key, or null if not found or expired.

```javascript
const value = db.get < string > "user:1234";
if (value) {
  console.log(`User: ${value.name}`);
} else {
  console.log("User not found");
}
```

### `set`

Sets a value in the database with an optional expiration.

- `key`: The key under which to store the value.
- `value`: The value to store.
- `expiresAt`: Optional expiration date for the key-value pair.

```javascript
// Set a value without expiration
db.set("user:1234", { name: "John Doe" });

// Set a value with expiration
const expirationDate = new Date();
expirationDate.setDate(expirationDate.getDate() + 30); // Expires in 30 days
db.set("session:5678", { token: "abc123" }, expirationDate);
```

### `exists`

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

### `delete`

Deletes a key-value pair from the database.

- `key`: The key to delete.

```javascript
db.delete("user:1234");
```

### `rename`

Renames a key in the database.

- `oldKey`: The current key name.
- `newKey`: The new key name.

```javascript
db.rename("user:old_id", "user:new_id");
```

### `expireAt`

Gets the expiration date of a key.

- `key`: The key to check.
- Returns: The expiration date of the key, or null if the key doesn't exist or has no expiration.

```javascript
const expirationDate = db.expireAt("session:5678");
if (expirationDate) {
  console.log(`Session expires at: ${expirationDate}`);
} else {
  console.log("Session has no expiration or does not exist");
}
```

### `keys`

Retrieves keys matching a pattern.

- `pattern`: SQL LIKE pattern to match keys. Defaults to "%" which matches all keys.
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

### `count`

Counts the number of keys in the database.

- Returns: The number of keys in the database.

```javascript
const count = db.count();
```

### `cleanup()`

Removes expired key-value pairs from the database.

```javascript
db.cleanup();
```

### `vacuum()`

Optimizes the database file, reducing its size.

```javascript
db.vacuum();
```

### `close()`

Closes the database connection.

```javascript
db.close();
```

### `flush(): void`

Ensures all the changes are written to disk.

```javascript
db.flush();
```

## Supported Value Types

`miftahDB` supports a variety of value types for storing and retrieving data. Here are the supported types with examples for each:

### 1. String

Store and retrieve string values:

```typescript
await db.set("string", "Hello!");
console.log(db.get<string>("string"));
```

### 2. Number

Store and retrieve numeric values:

```typescript
await db.set("number", 42);
console.log(db.get<number>("number"));
```

### 3. Boolean

Store and retrieve boolean values:

```typescript
await db.set("boolean", true);
console.log(db.get<boolean>("boolean"));
```

### 4. Array

Store and retrieve arrays:

```typescript
await db.set("array", [1, 2, 3, 4, 5]);
console.log(db.get<number[]>("array"));
```

### 5. Object

Store and retrieve objects:

```typescript
await db.set("object", { name: "Alice", age: 30 });
console.log(db.get<{ name: string; age: number }>("object"));
```

### 6. Buffer (Binary Data)

Store and retrieve binary data:

```typescript
const buffer = Buffer.from("binary data");
await db.set("buffer", buffer);
console.log(db.get<Buffer>("buffer"));
```

### 7. Date

Store and retrieve date objects:

```typescript
const date = new Date();
await db.set("date", date);
console.log(db.get<Date>("date"));
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
