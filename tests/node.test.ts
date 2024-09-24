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

  it("Backup", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.backup("backup_node_test.db");
  });

  it("Restore", () => {
    const db = createDB();
    db.restore("backup_node_test.db");
    assert.strictEqual(db.get("key1"), "value1");
  });

  it("Namespace Get/Set", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1");
    db.set("123", "value2");
    assert.strictEqual(users.get("123"), "value1");
    assert.strictEqual(db.get("users:123"), "value1");
    assert.strictEqual(db.get("123"), "value2");
  });

  it("Namespace MultiGet/MultiSet", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.multiSet([
      { key: "123", value: "value1" },
      { key: "456", value: "value2" },
    ]);
    const result = users.multiGet(["123", "456"]);
    db.multiSet([
      { key: "123", value: "value3" },
      { key: "456", value: "value4" },
    ]);
    const result2 = db.multiGet(["123", "456"]);
    assert.deepStrictEqual(result, { "123": "value1", "456": "value2" });
    assert.deepStrictEqual(result2, { "123": "value3", "456": "value4" });
  });

  it("Namespace Delete", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1");
    db.set("123", "value2");
    users.delete("123");
    assert.strictEqual(users.get("123"), null);
    assert.strictEqual(db.get("123"), "value2");
  });

  it("Namespace Rename", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1");
    db.set("123", "value2");
    users.rename("123", "456");
    assert.strictEqual(users.get("456"), "value1");
    assert.strictEqual(db.get("123"), "value2");
  });

  it("Namespace Exists", () => {
    const db = createDB();
    const users = db.namespace("users");
    assert.strictEqual(users.exists("123"), false);
    users.set("123", "value1");
    assert.strictEqual(users.exists("123"), true);
    assert.strictEqual(db.exists("123"), false);
  });

  it("Namespace Keys/Pagination", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1");
    users.set("456", "value2");
    users.set("789", "value3");
    db.set("45", "value4");
    db.set("12", "value5");
    db.set("78", "value6");
    assert.deepStrictEqual(users.keys(), ["123", "456", "789"]);
    assert.deepStrictEqual(users.pagination(2, 1), ["123", "456"]);
  });

  it("Namespace SetExpire/GetExpire", () => {
    const db = createDB();
    const users = db.namespace("users");
    const now = new Date();
    const futureDate = new Date(now.getTime() + 10000);
    users.set("123", "value1", futureDate);

    const margin = 1000;
    const expiration = users.getExpire("123");
    assert.strictEqual(
      Math.abs(expiration!.getTime() - futureDate.getTime()) < margin,
      true
    );
  });

  it("Namespace Count/CountExpired", () => {
    const db = createDB();
    const users = db.namespace("users");
    db.set("123", "value1", new Date("2005-01-01"));
    users.set("123", "value1");
    users.set("456", "value2");
    assert.strictEqual(users.count(), 2);
    assert.strictEqual(users.countExpired(), 0);
    assert.strictEqual(db.countExpired(), 1);
  });

  it("Namespace Flush", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1");
    db.set("123", "value2");
    users.flush();
    assert.strictEqual(users.exists("123"), false);
    assert.strictEqual(db.exists("123"), true);
  });

  it("Namespace Cleanup", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1", new Date("2005-01-01"));
    db.set("123", "value2", new Date("2005-01-01"));
    users.cleanup();
    assert.strictEqual(users.exists("123"), false);
    assert.strictEqual(db.exists("123"), true);
  });
});
