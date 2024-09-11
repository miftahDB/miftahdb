import DB, {
  type Database,
  type RunResult,
  SqliteError as DatabaseError,
} from "better-sqlite3";
import { BaseMiftahDB } from "./base";

/**
 * MiftahDB is a wrapper around `better-sqlite3`.
 * - https://miftahdb.sqlite3.online/docs/api-reference/constructor
 * @param {string} path - Path to the database file. Defaults to ":memory:" if not provided.
 * @example
 * // Create a new MiftahDB instance with disk-based database
 * const db = new MiftahDB("test.db");
 *
 * // Create a new MiftahDB instance with in-memory database
 * const memoryDB = new MiftahDB(":memory:");
 */
export class MiftahDB extends BaseMiftahDB<RunResult | unknown[]> {
  protected declare db: Database;
  protected initializeDB(path = ":memory:"): void {
    this.db = new DB(path);
  }

  public execute(sql: string, params: unknown[] = []): unknown[] | RunResult {
    const stmt = this.db.prepare(sql);
    if (stmt.reader) {
      return stmt.all(...params);
    }
    return stmt.run(...params);
  }
}

export type { RunResult };
export type { MiftahValue } from "./types";
export { DatabaseError };
