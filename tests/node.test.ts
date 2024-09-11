import { describe, it } from "node:test";
import assert from "node:assert";
import { MiftahDB } from "../src/index";

function createDB() {
  return new MiftahDB(":memory:");
}

describe("MiftahDB Node Tests", () => {
  it("set and get value", () => {
    const db = createDB();
    db.set("key1", "value1");
    const result = db.get("key1");
    assert.strictEqual(result, "value1");
  });

  it("check key existence", () => {
    const db = createDB();
    db.set("key1", "value1");
    assert.strictEqual(db.exists("key1"), true);
    assert.strictEqual(db.exists("nonexistent_key"), false);
  });

  it("delete key", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.delete("key1");
    assert.strictEqual(db.exists("key1"), false);
  });

  it("rename key", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.rename("key1", "key2");
    assert.strictEqual(db.get("key2"), "value1");
    assert.strictEqual(db.exists("key1"), false);
  });

  it("get expired value", () => {
    const db = createDB();
    const now = new Date();
    const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
    db.set("key1", "value1", pastDate);
    assert.strictEqual(db.get("key1"), null);
  });

  it("pagination", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.set("key2", "value2");
    db.set("key3", "value3");

    const result = db.pagination(2, 1);
    assert.deepStrictEqual(result, ["key1", "key2"]);
  });

  it("count keys", () => {
    const db = createDB();
    db.flush();
    db.set("key1", "value1");
    db.set("key2", "value2");
    assert.strictEqual(db.count(), 2);
  });

  it("count expired keys", () => {
    const db = createDB();
    const now = new Date();
    const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
    db.set("key1", "value1", pastDate);
    assert.strictEqual(db.countExpired(), 1);
  });

  it("vacuum database", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.delete("key1");
    db.vacuum(); // Test if vacuum runs without errors
    // No assertions needed, just ensure no error occurs
  });

  it("flush database", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.flush(); // Test if flush runs without errors
    assert.strictEqual(db.exists("key1"), false);
  });

  it("execute raw SQL", () => {
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

  it("set and get expiration", () => {
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
  it("multiget and multiset", () => {
    const db = createDB();
    db.multiSet([
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" },
    ]);
    const result = db.multiGet(["key1", "key2"]);
    assert.deepStrictEqual(result, { key1: "value1", key2: "value2" });
  });
  it("multiDelete", () => {
    const db = createDB();
    db.multiSet([
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" },
    ]);
    db.multiDelete(["key1", "key2"]);
    const result = db.multiGet(["key1", "key2"]);
    assert.deepStrictEqual(result, { key1: null, key2: null });
  });
});
