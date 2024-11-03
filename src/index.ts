import DB, { type Database } from "better-sqlite3";

import { BaseMiftahDB } from "./base";

/**
 * MiftahDB is a wrapper around `better-sqlite3`.
 * - https://miftahdb.sqlite3.online/docs/api-reference/constructor
 * @param {string} path - Path to the database file. Defaults to ":memory:" if not provided.
 * @example
 * // New MiftahDB instance with disk-based database
 * const db = new MiftahDB("test.db");
 *
 * //New MiftahDB instance with in-memory database
 * const db = new MiftahDB(":memory:");
 */
export class MiftahDB extends BaseMiftahDB {
  protected declare db: Database;
  protected initDatabase(path = ":memory:") {
    this.db = new DB(path);
  }
}

export type { RunResult } from "better-sqlite3";
export type { MiftahValue } from "./types";
