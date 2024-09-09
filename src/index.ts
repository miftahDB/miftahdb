import DB, { type Database } from "better-sqlite3";
import { BaseMiftahDB } from "./base";

/**
 * MiftahDB is a wrapper around `better-sqlite3`.
 * @example
 * // Create a new MiftahDB instance with disk-based database
 * const db = new MiftahDB("test.db");
 *
 * // Create a new MiftahDB instance with in-memory database
 * const memoryDB = new MiftahDB(":memory:");
 */
export class MiftahDB extends BaseMiftahDB {
  protected declare db: Database;
  protected initializeDB(path = ":memory:"): void {
    this.db = new DB(path);
  }
}
