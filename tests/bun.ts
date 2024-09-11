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
