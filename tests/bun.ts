import { expect, test } from "bun:test";
import { MiftahDB } from "../src/bun";

function createDB() {
  return new MiftahDB(":memory:");
}

test("set and get value", () => {
  const db = createDB();
  db.set("key1", "value1");
  const result = db.get<string>("key1");
  expect(result).toBe("value1");
});

test("check key existence", () => {
  const db = createDB();
  db.set("key1", "value1");
  expect(db.exists("key1")).toBe(true);
  expect(db.exists("nonexistent_key")).toBe(false);
});

test("delete key", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.delete("key1");
  expect(db.exists("key1")).toBe(false);
});

test("rename key", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.rename("key1", "key2");
  expect(db.get<string>("key2")).toBe("value1");
  expect(db.exists("key1")).toBe(false);
});

test("get expired value", () => {
  const db = createDB();
  const now = new Date();
  const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
  db.set("key1", "value1", pastDate);
  expect(db.get<string>("key1")).toBe(null);
});

test("pagination", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.set("key2", "value2");
  db.set("key3", "value3");

  const result = db.pagination(2, 1);
  expect(result).toEqual(["key1", "key2"]);
});

test("count keys", () => {
  const db = createDB();
  db.flush();
  db.set("key1", "value1");
  db.set("key2", "value2");
  expect(db.count()).toBe(2);
});

test("count expired keys", () => {
  const db = createDB();
  const now = new Date();
  const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago
  db.set("key1", "value1", pastDate);
  expect(db.countExpired()).toBe(1);
});

test("vacuum database", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.delete("key1");
  db.vacuum(); // Test if vacuum runs without errors
  // No assertions needed, just ensure no error occurs
});

test("flush database", () => {
  const db = createDB();
  db.set("key1", "value1");
  db.flush(); // Test if flush runs without errors
  expect(db.exists("key1")).toBe(false);
});

test("execute raw SQL", () => {
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

test("set and get expiration", () => {
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
