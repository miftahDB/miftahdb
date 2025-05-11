import { describe, it } from "node:test";
import assert from "node:assert";
import { MiftahDB, type Result } from "../src/index";

function createDB() {
  return new MiftahDB(":memory:");
}

describe("MiftahDB Node Tests", () => {
  it("Set & Get", () => {
    const db = createDB();
    db.set("key1", "value1");
    const result = db.get("key1");
    if (result.success) {
      assert.strictEqual(result.data, "value1");
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Exists", () => {
    const db = createDB();
    db.set("key1", "value1");
    assert.strictEqual(db.exists("key1").success, true);
    assert.strictEqual(db.exists("nonexistent_key").success, false);
  });

  it("Delete", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.delete("key1");
    assert.strictEqual(db.exists("key1").success, false);
  });

  it("Rename", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.rename("key1", "key2");
    const key2Result = db.get<string>("key2");
    if (key2Result.success) {
      assert.strictEqual(key2Result.data, "value1");
    } else {
      throw new Error(key2Result.error.message);
    }
    assert.strictEqual(db.exists("key1").success, false);
  });

  it("Get Expired", () => {
    const db = createDB();
    const now = new Date();
    const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
    db.set("key1", "value1", pastDate);
    const result = db.get("key1");
    if (result.success) {
      throw new Error("Key should not exist");
    }
    assert.strictEqual(result.error.message, "Key expired");
  });

  it("Pagination", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.set("key2", "value2");
    db.set("key3", "value3");

    const result = db.pagination(2, 1);
    if (result.success) {
      assert.deepStrictEqual(result.data, ["key1", "key2"]);
    } else {
      throw new Error(result.error.message);
    }
  });

  it("expiredRange", () => {
    const db = createDB();
    db.set("key1", "value1", new Date("2023-01-01"));
    db.set("key2", "value2", new Date("2023-01-02"));
    db.set("key3", "value3", new Date("2023-01-03"));
    db.set("key4", "value4", new Date("2023-01-04"));
    db.set("key5", "value5", new Date("2023-01-05"));

    const result = db.expiredRange(
      new Date("2023-01-02"),
      new Date("2023-01-04")
    );
    if (result.success) {
      assert.deepStrictEqual(result.data, ["key2", "key3", "key4"]);
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Count", () => {
    const db = createDB();
    db.flush();
    db.set("key1", "value1");
    db.set("key2", "value2");
    const result = db.count();
    if (result.success) {
      assert.strictEqual(result.data, 2);
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Count Expired", () => {
    const db = createDB();
    const now = new Date();
    const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
    db.set("key1", "value1", pastDate);
    const result = db.countExpired();
    if (result.success) {
      assert.strictEqual(result.data, 1);
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Vacuum", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.delete("key1");
    const result = db.vacuum();
    if (result.success) {
      assert.strictEqual(result.data, true);
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Flush", () => {
    const db = createDB();
    db.set("key1", "value1");
    db.flush(); // Test if flush runs without errors
    const result = db.exists("key1");
    if (result.success) {
      throw new Error("Key should not exist");
    }
    assert.strictEqual(result.error.message, "Key not found");
  });

  it("Execute", () => {
    const db = createDB();
    db.execute(
      "CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, value TEXT)"
    );
    db.execute("INSERT INTO test (value) VALUES (?)", ["test_value"]);
    const result = db.execute("SELECT value FROM test WHERE id = 1") as Result<
      {
        value: string;
      }[]
    >;

    if (!result.success) throw new Error(result.error.message);
    assert.strictEqual(result.data[0].value, "test_value");
  });

  it("Set & Get Expiration", () => {
    const db = createDB();
    const now = new Date();
    const futureDate = new Date(now.getTime() + 10000);
    db.set("key1", "value1", futureDate);

    const margin = 1000;
    const result = db.getExpire("key1");
    if (result.success) {
      assert.strictEqual(
        Math.abs(result.data?.getTime()! - futureDate.getTime()!) < margin,
        true
      );
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Persist", () => {
    const db = createDB();
    db.set("key1", "value1", new Date("2020-01-01"));
    db.persist("key1");
    const result = db.get("key1");
    if (result.success) {
      assert.strictEqual(result.data, "value1");
    } else {
      throw new Error(result.error.message);
    }
  });

  it("TTL", () => {
    const db = createDB();
    db.set("key1", "value1", new Date("2020-01-01"));
    const result = db.ttl("key1");
    if (result.success) {
      throw new Error("TTL should be undefined");
    } else {
      assert.strictEqual(result.error.message, "Key expired");
    }
  });

  it("Multi Set & Get", () => {
    const db = createDB();
    db.multiSet([
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" },
    ]);
    const result = db.multiGet(["key1", "key2"]);
    if (result.success) {
      assert.deepStrictEqual(result.data, ["value1", "value2"]);
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Increment", () => {
    const db = createDB();
    db.set("key1", 1);
    db.increment("key1");
    const result = db.get("key1");
    if (result.success) {
      assert.strictEqual(result.data, 2);
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Decrement", () => {
    const db = createDB();
    db.set("key1", 2);
    db.decrement("key1");
    const result = db.get("key1");
    if (result.success) {
      assert.strictEqual(result.data, 1);
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Multi Delete", () => {
    const db = createDB();
    db.multiSet([
      { key: "key1", value: "value1" },
      { key: "key2", value: "value2" },
    ]);
    db.multiDelete(["key1", "key2"]);
    const result = db.multiGet(["key1", "key2"]);
    if (result.success) {
      throw new Error("No keys found should be an error");
    }
    assert.strictEqual(result.error.message, "No keys found");
  });

  it("Backup", async () => {
    const db = createDB();
    db.set("key1", "value1");
    await db.backup("backup_node_test.db");
  });

  it("Restore", async () => {
    const db = createDB();
    await db.restore("backup_node_test.db");
    const result = db.get("key1");
    if (result.success) {
      assert.strictEqual(result.data, "value1");
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Namespace Get/Set", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1");
    db.set("123", "value2");
    const result = users.get("123");
    if (result.success) {
      assert.strictEqual(result.data, "value1");
    } else {
      throw new Error(result.error.message);
    }
    const result2 = db.get("users:123");
    if (result2.success) {
      assert.strictEqual(result2.data, "value1");
    } else {
      throw new Error(result2.error.message);
    }
    const result3 = db.get("123");
    if (result3.success) {
      assert.strictEqual(result3.data, "value2");
    } else {
      throw new Error(result3.error.message);
    }
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
    if (result.success) {
      assert.deepStrictEqual(result.data, ["value1", "value2"]);
    } else {
      throw new Error(result.error.message);
    }
    if (result2.success) {
      assert.deepStrictEqual(result2.data, ["value3", "value4"]);
    } else {
      throw new Error(result2.error.message);
    }
  });

  it("Namespace Delete", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1");
    db.set("123", "value2");
    users.delete("123");
    const result = users.get("123");
    if (result.success) {
      throw new Error("Key should not exist");
    }
    assert.strictEqual(result.error.message, "Key not found");

    const result2 = db.get("123");
    if (result2.success) {
      assert.strictEqual(result2.data, "value2");
    } else {
      throw new Error(result2.error.message);
    }
  });

  it("Namespace Rename", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1");
    db.set("123", "value2");
    users.rename("123", "456");
    const result = users.get("456");
    if (result.success) {
      assert.strictEqual(result.data, "value1");
    } else {
      throw new Error(result.error.message);
    }
    const result2 = db.get("123");
    if (result2.success) {
      assert.strictEqual(result2.data, "value2");
    } else {
      throw new Error(result2.error.message);
    }
  });

  it("Namespace Exists", () => {
    const db = createDB();
    const users = db.namespace("users");
    const result = users.exists("123");
    if (result.success) {
      throw new Error("User should not exist");
    }
    assert.strictEqual(result.error.message, "Key not found");
    users.set("123", "value1");
    const result2 = users.exists("123");
    if (result2.success) {
      assert.strictEqual(result2.data, true);
    } else {
      throw new Error(result2.error.message);
    }
    const result3 = db.exists("123");
    if (result3.success) {
      throw new Error("User should not exist");
    }
    assert.strictEqual(result3.error.message, "Key not found");
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
    const result = users.keys();
    if (result.success) {
      assert.deepStrictEqual(result.data, ["123", "456", "789"]);
    } else {
      throw new Error(result.error.message);
    }
    const result2 = users.pagination(2, 1);
    if (result2.success) {
      assert.deepStrictEqual(result2.data, ["123", "456"]);
    } else {
      throw new Error(result2.error.message);
    }
  });

  it("Namespace expiredRange", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1", new Date("2023-01-01"));
    users.set("456", "value2", new Date("2023-01-02"));
    users.set("789", "value3", new Date("2023-01-03"));
    users.set("101", "value4", new Date("2023-01-04"));
    users.set("135", "value5", new Date("2023-01-05"));

    const result = users.expiredRange(
      new Date("2023-01-02"),
      new Date("2023-01-04")
    );
    if (result.success) {
      assert.deepStrictEqual(result.data, ["456", "789", "101"]);
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Namespace SetExpire/GetExpire", () => {
    const db = createDB();
    const users = db.namespace("users");
    const now = new Date();
    const futureDate = new Date(now.getTime() + 10000);
    users.set("123", "value1", futureDate);

    const margin = 1000;
    const result = users.getExpire("123");
    if (result.success) {
      assert.strictEqual(
        Math.abs(result.data?.getTime()! - futureDate.getTime()!) < margin,
        true
      );
    } else {
      throw new Error(result.error.message);
    }
  });

  it("Namespace Count/CountExpired", () => {
    const db = createDB();
    const users = db.namespace("users");
    db.set("123", "value1", new Date("2005-01-01"));
    users.set("123", "value1");
    users.set("456", "value2");
    const result = users.count();
    if (result.success) {
      assert.strictEqual(result.data, 2);
    } else {
      throw new Error(result.error.message);
    }
    const result2 = users.countExpired();
    if (result2.success) {
      assert.strictEqual(result2.data, 0);
    } else {
      throw new Error(result2.error.message);
    }
    const result3 = db.countExpired();
    if (result3.success) {
      assert.strictEqual(result3.data, 1);
    } else {
      throw new Error(result3.error.message);
    }
  });

  it("Namespace Flush", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1");
    db.set("123", "value2");
    users.flush();
    const result = users.exists("123");
    if (result.success) {
      throw new Error("User should not exist");
    }
    assert.strictEqual(result.error.message, "Key not found");
    const result2 = db.exists("123");
    if (result2.success) {
      assert.strictEqual(result2.data, true);
    } else {
      throw new Error(result2.error.message);
    }
  });

  it("Namespace Cleanup", () => {
    const db = createDB();
    const users = db.namespace("users");
    users.set("123", "value1", new Date("2005-01-01"));
    db.set("123", "value2", new Date("2005-01-01"));
    users.cleanup();
    const result = users.exists("123");
    if (result.success) {
      throw new Error("User should not exist");
    }
    assert.strictEqual(result.error.message, "Key not found");
    const result2 = db.exists("123");
    if (result2.success) {
      assert.strictEqual(result2.data, true);
    } else {
      throw new Error(result2.error.message);
    }
  });
});
