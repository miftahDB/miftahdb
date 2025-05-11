import { expect, test } from "bun:test";
import { MiftahDB, type Result } from "../src/bun";

function createDB() {
  return new MiftahDB(":memory:");
}

test("Set & Get", () => {
  const db = createDB();
  db.set("key1", "value1");
  const result = db.get<string>("key1");
  if (result.success) {
    expect(result.data).toBe("value1");
  } else {
    throw new Error(result.error.message);
  }
});

test("Exists", () => {
  const db = createDB();
  db.set("key1", "value1");
  expect(db.exists("key1").success).toBe(true);
  expect(db.exists("nonexistent_key").success).toBe(false);
});

test("Delete", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.delete("key1");
  expect(db.exists("key1").success).toBe(false);
});

test("Rename", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.rename("key1", "key2");
  const key2Result = db.get<string>("key2");
  if (key2Result.success) {
    expect(key2Result.data).toBe("value1");
  } else {
    throw new Error(key2Result.error.message);
  }
  expect(db.exists("key1").success).toBe(false);
});

test("Get Expired", () => {
  const db = createDB();
  const now = new Date();
  const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
  db.set("key1", "value1", pastDate);
  const result = db.get("key1");
  if (result.success) {
    throw new Error("Key should not exist");
  }
  expect(result.error.message).toBe("Key expired");
});

test("Pagination", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.set("key2", "value2");
  db.set("key3", "value3");

  const result = db.pagination(2, 1);
  if (result.success) {
    expect(result.data).toEqual(["key1", "key2"]);
  } else {
    throw new Error(result.error.message);
  }
});

test("expiredRange", () => {
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
    expect(result.data).toEqual(["key2", "key3", "key4"]);
  } else {
    throw new Error(result.error.message);
  }
});

test("Count", () => {
  const db = createDB();
  db.flush();
  db.set("key1", "value1");
  db.set("key2", "value2");
  const result = db.count();
  if (result.success) {
    expect(result.data).toBe(2);
  } else {
    throw new Error(result.error.message);
  }
});

test("Count Expired", () => {
  const db = createDB();
  const now = new Date();
  const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
  db.set("key1", "value1", pastDate);
  const result = db.countExpired();
  if (result.success) {
    expect(result.data).toBe(1);
  } else {
    throw new Error(result.error.message);
  }
});

test("Vacuum", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.delete("key1");
  const result = db.vacuum();
  if (result.success) {
    expect(result.data).toBe(true);
  } else {
    throw new Error(result.error.message);
  }
});

test("Flush", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.flush(); // Test if flush runs without errors
  const result = db.exists("key1");
  if (result.success) {
    expect(result.data).toBe(false);
  }
});

test("Execute", () => {
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
  expect(result.data[0].value).toBe("test_value");
});

test("Set & Get Expiration", () => {
  const db = createDB();
  const now = new Date();
  const futureDate = new Date(now.getTime() + 10000);
  db.set("key1", "value1", futureDate);

  const margin = 1000;
  const result = db.getExpire("key1");
  if (result.success) {
    expect(
      Math.abs(result.data?.getTime()! - futureDate.getTime()!) < margin
    ).toBe(true);
  } else {
    throw new Error(result.error.message);
  }
});

test("Persist", () => {
  const db = createDB();
  db.set("key1", "value1", new Date("2020-01-01"));
  db.persist("key1");
  const result = db.get("key1");
  if (result.success) {
    expect(result.data).toBe("value1");
  } else {
    throw new Error(result.error.message);
  }
});

test("TTL", () => {
  const db = createDB();
  db.set("key1", "value1", new Date("2020-01-01"));
  const result = db.ttl("key1");
  if (result.success) {
    throw new Error("TTL should be undefined");
  } else {
    expect(result.error.message).toBe("Key expired");
  }
});

test("Multi Set & Get", () => {
  const db = createDB();
  db.multiSet([
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
  ]);
  const result = db.multiGet(["key1", "key2"]);
  if (result.success) {
    expect(result.data).toEqual(["value1", "value2"]);
  } else {
    throw new Error(result.error.message);
  }
});

test("Multi Delete", () => {
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
  expect(result.error.message).toBe("No keys found");
});

test("Backup", async () => {
  const db = createDB();
  db.set("key1", "value1");
  await db.backup("backup_bun_test.db");
});

test("Restore", async () => {
  const db = createDB();
  await db.restore("backup_bun_test.db");
  const result = db.get<string>("key1");
  if (result.success) {
    expect(result.data).toBe("value1");
  } else {
    throw new Error(result.error.message);
  }
});

test("Namespace Get/Set", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1");
  db.set("123", "value2");
  const result = users.get<string>("123");
  if (result.success) {
    expect(result.data).toBe("value1");
  } else {
    throw new Error(result.error.message);
  }
  const result2 = db.get<string>("users:123");
  if (result2.success) {
    expect(result2.data).toBe("value1");
  } else {
    throw new Error(result2.error.message);
  }
  const result3 = db.get<string>("123");
  if (result3.success) {
    expect(result3.data).toBe("value2");
  } else {
    throw new Error(result3.error.message);
  }
});

test("Namespace MultiGet/MultiSet", () => {
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
    expect(result.data).toEqual(["value1", "value2"]);
  } else {
    throw new Error(result.error.message);
  }
  if (result2.success) {
    expect(result2.data).toEqual(["value3", "value4"]);
  } else {
    throw new Error(result2.error.message);
  }
});

test("Namespace Delete", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1");
  db.set("123", "value2");
  users.delete("123");
  const result = users.get<string>("123");
  if (result.success) {
    throw new Error("Key should not exist");
  }
  expect(result.error.message).toBe("Key not found");

  const result2 = db.get<string>("123");
  if (result2.success) {
    expect(result2.data).toBe("value2");
  } else {
    throw new Error(result2.error.message);
  }
});

test("Namespace Rename", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1");
  db.set("123", "value2");
  users.rename("123", "456");
  const result = users.get<string>("456");
  if (result.success) {
    expect(result.data).toBe("value1");
  } else {
    throw new Error(result.error.message);
  }
  const result2 = db.get<string>("123");
  if (result2.success) {
    expect(result2.data).toBe("value2");
  } else {
    throw new Error(result2.error.message);
  }
});

test("Namespace Exists", () => {
  const db = createDB();
  const users = db.namespace("users");
  const result = users.exists("123");
  if (result.success) {
    throw new Error("User should not exist");
  }
  expect(result.error.message).toBe("Key not found");
  users.set("123", "value1");
  const result2 = users.exists("123");
  if (result2.success) {
    expect(result2.data).toBe(true);
  } else {
    throw new Error(result2.error.message);
  }
  const result3 = db.exists("123");
  if (result3.success) {
    throw new Error("User should not exist");
  }
  expect(result3.error.message).toBe("Key not found");
});

test("Namespace Keys/Pagination", () => {
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
    expect(result.data).toEqual(["123", "456", "789"]);
  } else {
    throw new Error(result.error.message);
  }
  const result2 = users.pagination(2, 1);
  if (result2.success) {
    expect(result2.data).toEqual(["123", "456"]);
  } else {
    throw new Error(result2.error.message);
  }
});

test("Namespace expiredRange", () => {
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
    expect(result.data).toEqual(["456", "789", "101"]);
  } else {
    throw new Error(result.error.message);
  }
});

test("Namespace SetExpire/GetExpire", () => {
  const db = createDB();
  const users = db.namespace("users");
  const now = new Date();
  const futureDate = new Date(now.getTime() + 10000);
  users.set("123", "value1", futureDate);

  const margin = 1000;
  const result = users.getExpire("123");
  if (result.success) {
    expect(
      Math.abs(result.data?.getTime()! - futureDate.getTime()!) < margin
    ).toBe(true);
  } else {
    throw new Error(result.error.message);
  }
});

test("Namespace Count/CountExpired", () => {
  const db = createDB();
  const users = db.namespace("users");
  db.set("123", "value1", new Date("2005-01-01"));
  users.set("123", "value1");
  users.set("456", "value2");
  const result = users.count();
  if (result.success) {
    expect(result.data).toBe(2);
  } else {
    throw new Error(result.error.message);
  }
  const result2 = users.countExpired();
  if (result2.success) {
    expect(result2.data).toBe(0);
  } else {
    throw new Error(result2.error.message);
  }
  const result3 = db.countExpired();
  if (result3.success) {
    expect(result3.data).toBe(1);
  } else {
    throw new Error(result3.error.message);
  }
});

test("Namespace Flush", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1");
  db.set("123", "value2");
  users.flush();
  const result = users.exists("123");
  if (result.success) {
    throw new Error("User should not exist");
  }
  expect(result.error.message).toBe("Key not found");
  const result2 = db.exists("123");
  if (result2.success) {
    expect(result2.data).toBe(true);
  } else {
    throw new Error(result2.error.message);
  }
});

test("Namespace Cleanup", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1", new Date("2005-01-01"));
  db.set("123", "value2", new Date("2005-01-01"));
  users.cleanup();
  const result = users.exists("123");
  if (result.success) {
    throw new Error("User should not exist");
  }
  expect(result.error.message).toBe("Key not found");

  const result2 = db.exists("123");
  if (result2.success) {
    expect(result2.data).toBe(true);
  } else {
    throw new Error(result2.error.message);
  }
});
