import { describe, it } from "node:test";
import assert from "node:assert";
import { MiftahDB } from "../src/index";

function createDB() {
  return new MiftahDB(":memory:");
}

describe("MiftahDB Node Tests", () => {
  it("Set & Get", () => {
    const db = createDB();
    db.set("key1", "value1");
    const result = db.get("key1");
    assert.strictEqual(result, "value1");
  });

  it("Exists", () => {
    const db = createDB();
    db.set("key1", "value1");
    assert.strictEqual(db.exists("key1"), true);
    assert.strictEqual(db.exists("nonexistent_key"), false);
  });

  it("Delete", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.delete("key1");
    assert.strictEqual(db.exists("key1"), false);
  });

  it("Rename", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.rename("key1", "key2");
    assert.strictEqual(db.get("key2"), "value1");
    assert.strictEqual(db.exists("key1"), false);
  });

  it("Get Expired", () => {
    const db = createDB();
    const now = new Date();
    const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
    db.set("key1", "value1", pastDate);
    assert.strictEqual(db.get("key1"), null);
  });

  it("Pagination", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.set("key2", "value2");
    db.set("key3", "value3");

    const result = db.pagination(2, 1);
    assert.deepStrictEqual(result, ["key1", "key2"]);
  });

  it("Count", () => {
    const db = createDB();
    db.flush();
    db.set("key1", "value1");
    db.set("key2", "value2");
    assert.strictEqual(db.count(), 2);
  });

  it("Count Expired", () => {
    const db = createDB();
    const now = new Date();
    const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
    db.set("key1", "value1", pastDate);
    assert.strictEqual(db.countExpired(), 1);
  });

  it("Vacuum", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.delete("key1");
    db.vacuum(); // Test if vacuum runs without errors
    // No assertions needed, just ensure no error occurs
  });

  it("Flush", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.flush(); // Test if flush runs without errors
    assert.strictEqual(db.exists("key1"), false);
  });

  it("Execute", () => {
    const db = createDB();
    db.execute(
      "CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, value TEXT)"
    );
    db.execute("INSERT INTO test (value) VALUES (?)", ["test_value"]);
    const result = db.execute("SELECT value FROM test WHERE id = 1") as {
      value: string;
    }[];
    console.log(result);
    assert.strictEqual(result[0].value, "test_value");
  });

  it("Set & Get Expiration", () => {
    const db = createDB();
    const now = new Date();
    const futureDate = new Date(now.getTime() + 10000);
    db.set("key1", "value1", futureDate);

    const margin = 1000;
    const expiration = db.getExpire("key1");
    assert.strictEqual(
      Math.abs(expiration?.getTime()! - futureDate.getTime()!) < margin,
      true
    );
  });

  it("Multi Set & Get", () => {
    const db = createDB();
    db.multiSet([
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" },
    ]);
    const result = db.multiGet(["key1", "key2"]);
    assert.deepStrictEqual(result, { key1: "value1", key2: "value2" });
  });

  it("Multi Delete", () => {
    const db = createDB();
    db.multiSet([
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" },
    ]);
    db.multiDelete(["key1", "key2"]);
    const result = db.multiGet(["key1", "key2"]);
    assert.deepStrictEqual(result, { key1: null, key2: null });
  });

  it("Backup and Restore", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.backup("backup.db");
    db.restore("backup.db");
    assert.strictEqual(db.get("key1"), "value1");
  });
});
