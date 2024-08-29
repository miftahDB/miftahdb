import SQLiteDatabase, { Database, Statement } from "better-sqlite3";
import msgpack from "msgpack-lite";

type KeyValue = string | number | boolean | object | Buffer | null;

/**
 * Interface for MiftahDB.
 */
interface IMiftahDB {
  /**
   * Retrieves the value associated with the given key.
   * @param key - The key to retrieve.
   * @returns The value associated with the key, or null if not found or expired.
   */
  get<T>(key: string): T | null;

  /**
   * Sets a value for the given key.
   * @param key - The key to set.
   * @param value - The value to store.
   * @param expiresAt - Optional expiration date for the value.
   */
  set<T extends KeyValue>(key: string, value: T, expiresAt?: Date): void;

  /**
   * Deletes the value associated with the given key.
   * @param key - The key to delete.
   */
  delete(key: string): void;

  /**
   * Reclaims unused space in the database.
   */
  vacuum(): void;

  /**
   * Closes the database connection and performs cleanup.
   */
  close(): void;
}

/**
 * Represents an item in MiftahDB.
 */
interface MiftahDBItem {
  value: Buffer;
  expires_at: number | null;
}

/**
 * MiftahDB implementation using SQLite and MessagePack.
 */
class MiftahDB implements IMiftahDB {
  private readonly db: Database;
  private readonly getStmt: Statement;
  private readonly setStmt: Statement;
  private readonly deleteStmt: Statement;
  private readonly cleanupStmt: Statement;

  constructor(dbPath: string) {
    this.db = new SQLiteDatabase(dbPath, { fileMustExist: false });
    this.initDatabase();

    this.getStmt = this.db.prepare(
      "SELECT value, expires_at FROM key_value_store WHERE key = ? LIMIT 1"
    );
    this.setStmt = this.db.prepare(
      "INSERT OR REPLACE INTO key_value_store (key, value, expires_at) VALUES (?, ?, ?)"
    );
    this.deleteStmt = this.db.prepare(
      "DELETE FROM key_value_store WHERE key = ?"
    );
    this.cleanupStmt = this.db.prepare(
      "DELETE FROM key_value_store WHERE expires_at IS NOT NULL AND expires_at <= ?"
    );
  }

  private initDatabase(): void {
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this.db.pragma("temp_store = MEMORY");
    this.db.pragma("cache_size = -64000"); // 64MB cache

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS key_value_store (
        key TEXT PRIMARY KEY,
        value BLOB,
        expires_at INTEGER
      ) WITHOUT ROWID;
      CREATE INDEX IF NOT EXISTS idx_expires_at ON key_value_store(expires_at);
    `);
  }

  public get<T>(key: string): T | null {
    const result = this.getStmt.get(key) as MiftahDBItem | undefined;

    if (!result) return null;

    if (result.expires_at && result.expires_at <= Date.now()) {
      this.delete(key);
      return null;
    }

    try {
      const marker = result.value[0]; // Get the marker byte
      const actualValue = result.value.slice(1); // Get the actual data

      if (marker === 0x01) {
        // Raw buffer
        return actualValue as T;
      } else if (marker === 0x02) {
        // MessagePack encoded data
        const decodedValue = msgpack.decode(actualValue);
        return decodedValue as T;
      } else {
        throw new Error("Unknown data marker.");
      }
    } catch (err) {
      console.error("Failed to decode value:", err);
      return null;
    }
  }

  public set<T extends KeyValue>(
    key: string,
    value: T,
    expiresAt?: Date
  ): void {
    let encodedValue: Buffer;

    if (Buffer.isBuffer(value)) {
      // Raw buffer
      const marker = Buffer.from([0x01]);
      encodedValue = Buffer.concat([marker, value]);
    } else {
      // MessagePack encoded data
      const marker = Buffer.from([0x02]);
      const msgPackedValue = msgpack.encode(value);
      encodedValue = Buffer.concat([marker, msgPackedValue]);
    }

    const expiresAtMs = expiresAt ? expiresAt.getTime() : null;
    this.setStmt.run(key, encodedValue, expiresAtMs);
  }

  public delete(key: string): void {
    this.deleteStmt.run(key);
  }

  public vacuum(): void {
    this.db.exec("VACUUM");
  }

  public close(): void {
    this.cleanup();
    this.db.close();
  }

  private cleanup(): void {
    this.cleanupStmt.run(Date.now());
  }
}

export default MiftahDB;

// Example usage
const db = new MiftahDB("test.db");

db.set("key2", "value", new Date(Date.now() + 60 * 1000));

console.log(db.get<string>("key"));

db.set("string", "Hello, World!");
db.set("number", 42);
db.set("float", 3.14);
db.set("boolean", true);
db.set("binary", Buffer.from([0x01, 0x02, 0x03]));
db.set("array", [1, 2, 3, "four"]);
db.set("object", { name: "Alice", age: 30 });
db.set("null", null);

// Try retrieving data
console.log(db.get<string>("string")); // "Hello, World!"
console.log(db.get<number>("number")); // 42
console.log(db.get<number>("float")); // 3.14
console.log(db.get<boolean>("boolean")); // true
console.log(db.get<Buffer>("binary")); // <Buffer 01 02 03>
console.log(db.get<any[]>("array")); // [1, 2, 3, "four"]
console.log(db.get<{ name: string; age: number }>("object")); // { name: "Alice", age: 30 }
console.log(db.get<any>("null")); // null
