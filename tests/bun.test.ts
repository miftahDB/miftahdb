import { expect, test } from "bun:test";
import { MiftahDB } from "../src/bun";

function createDB() {
  return new MiftahDB(":memory:");
}

test("Set & Get", () => {
  const db = createDB();
  db.set("key1", "value1");
  const result = db.get<string>("key1");
  expect(result).toBe("value1");
});

test("Exists", () => {
  const db = createDB();
  db.set("key1", "value1");
  expect(db.exists("key1")).toBe(true);
  expect(db.exists("nonexistent_key")).toBe(false);
});

test("Delete", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.delete("key1");
  expect(db.exists("key1")).toBe(false);
});

test("Rename", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.rename("key1", "key2");
  expect(db.get<string>("key2")).toBe("value1");
  expect(db.exists("key1")).toBe(false);
});

test("Get Expired", () => {
  const db = createDB();
  const now = new Date();
  const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
  db.set("key1", "value1", pastDate);
  expect(db.get<string>("key1")).toBe(null);
});

test("Pagination", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.set("key2", "value2");
  db.set("key3", "value3");

  const result = db.pagination(2, 1);
  expect(result).toEqual(["key1", "key2"]);
});

test("Count", () => {
  const db = createDB();
  db.flush();
  db.set("key1", "value1");
  db.set("key2", "value2");
  expect(db.count()).toBe(2);
});

test("Count Expired", () => {
  const db = createDB();
  const now = new Date();
  const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
  db.set("key1", "value1", pastDate);
  expect(db.countExpired()).toBe(1);
});

test("Vacuum", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.delete("key1");
  db.vacuum(); // Test if vacuum runs without errors
  // No assertions needed, just ensure no error occurs
});

test("Flush", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.flush(); // Test if flush runs without errors
  expect(db.exists("key1")).toBe(false);
});

test("Execute", () => {
  const db = createDB();
  db.execute(
    "CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, value TEXT)"
  );
  db.execute("INSERT INTO test (value) VALUES (?)", ["test_value"]);
  const result = db.execute("SELECT value FROM test WHERE id = 1") as {
    value: string;
  }[];
  expect(result[0].value).toBe("test_value");
});

test("Set & Get Expiration", () => {
  const db = createDB();
  const now = new Date();
  const futureDate = new Date(now.getTime() + 10000);
  db.set("key1", "value1", futureDate);

  const margin = 1000;
  const expiration = db.getExpire("key1");
  expect(
    Math.abs(expiration?.getTime()! - futureDate.getTime()!) < margin
  ).toBe(true);
});

test("Multi Set & Get", () => {
  const db = createDB();
  db.multiSet([
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
  ]);
  const result = db.multiGet(["key1", "key2"]);
  expect(result).toEqual({ key1: "value1", key2: "value2" });
});

test("Multi Delete", () => {
  const db = createDB();
  db.multiSet([
    { key: "key1", value: "value1" },
    { key: "key2", value: "value2" },
  ]);
  db.multiDelete(["key1", "key2"]);
  const result = db.multiGet(["key1", "key2"]);
  expect(result).toEqual({ key1: null, key2: null });
});

test("Backup", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.backup("backup_bun_test.db");
});

test("Restore", () => {
  const db = createDB();
  db.restore("backup_bun_test.db");
  expect(db.get<string>("key1")).toBe("value1");
});

test("Namespace Get/Set", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1");
  db.set("123", "value2");
  expect(users.get<string>("123")).toBe("value1");
  expect(db.get<string>("users:123")).toBe("value1");
  expect(db.get<string>("123")).toBe("value2");
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
  expect(result).toEqual({ "123": "value1", "456": "value2" });
  expect(result2).toEqual({ "123": "value3", "456": "value4" });
});

test("Namespace Delete", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1");
  db.set("123", "value2");
  users.delete("123");
  expect(users.get<string>("123")).toBe(null);
  expect(db.get<string>("123")).toBe("value2");
});

test("Namespace Rename", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1");
  db.set("123", "value2");
  users.rename("123", "456");
  expect(users.get<string>("456")).toBe("value1");
  expect(db.get<string>("123")).toBe("value2");
});

test("Namespace Exists", () => {
  const db = createDB();
  const users = db.namespace("users");
  expect(users.exists("123")).toBe(false);
  users.set("123", "value1");
  expect(users.exists("123")).toBe(true);
  expect(db.exists("123")).toBe(false);
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
  expect(users.keys()).toEqual(["123", "456", "789"]);
  expect(users.pagination(2, 1)).toEqual(["123", "456"]);
});

test("Namespace SetExpire/GetExpire", () => {
  const db = createDB();
  const users = db.namespace("users");
  const now = new Date();
  const futureDate = new Date(now.getTime() + 10000);
  users.set("123", "value1", futureDate);

  const margin = 1000;
  const expiration = users.getExpire("123");
  expect(
    Math.abs(expiration?.getTime()! - futureDate.getTime()!) < margin
  ).toBe(true);
});

test("Namespace Count/CountExpired", () => {
  const db = createDB();
  const users = db.namespace("users");
  db.set("123", "value1", new Date("2005-01-01"));
  users.set("123", "value1");
  users.set("456", "value2");
  expect(users.count()).toBe(2);
  expect(users.countExpired()).toBe(0);
  expect(db.countExpired()).toBe(1);
});

test("Namespace Flush", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1");
  db.set("123", "value2");
  users.flush();
  expect(users.exists("123")).toBe(false);
  expect(db.exists("123")).toBe(true);
});

test("Namespace Cleanup", () => {
  const db = createDB();
  const users = db.namespace("users");
  users.set("123", "value1", new Date("2005-01-01"));
  db.set("123", "value2", new Date("2005-01-01"));
  users.cleanup();
  expect(users.exists("123")).toBe(false);
  expect(db.exists("123")).toBe(true);
});
