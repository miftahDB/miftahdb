import DB from "bun:sqlite";
import { readFile } from "node:fs/promises";

import { BaseMiftahDB } from "./base";
import type { Result, PromiseResult } from "./types.ts";
import { SafeExecution } from "./utils";

// Intentionally using a type assertion here to align `bun:sqlite`'s `Database` type with `better-sqlite3`.
// Although `bun:sqlite` and `better-sqlite3` have different implementations, their API is similar enough for our purposes.
// This trick helps avoid TypeScript errors while maintaining compatibility across both environments.
// Also run `bun run test` for double-checking.
// import type { Database } from "bun:sqlite";
import type { Database } from "better-sqlite3";

/**
 * MiftahDB is a wrapper around `bun:sqlite`.
 * - https://miftahdb.sqlite3.online/docs/api-reference/constructor
 * @param {string} path - Path to the database file. Defaults to ":memory:" if not provided.
 * @param {DBOptions} options - Optional configuration options for the database.
 * @example
 * // New MiftahDB instance with disk-based database
 * const db = new MiftahDB("test.db");
 *
 * //New MiftahDB instance with in-memory database
 * const db = new MiftahDB(":memory:");
 */
export class MiftahDB extends BaseMiftahDB {
  protected declare db: Database;
  protected initDatabase(path = ":memory:"): void {
    this.db = new DB(path) as unknown as Database;
  }

  @SafeExecution
  override execute(sql: string, params: unknown[] = []): Result<unknown[]> {
    const stmt = this.db.prepare(sql);

    return {
      success: true,
      data: stmt.all(...params),
    };
  }

  @SafeExecution
  override async restore(path: string): PromiseResult<boolean> {
    const file = await readFile(path);

    // @ts-expect-error `deserialize` exists in `bun:sqlite` but not in `better-sqlite3`.
    this.db = DB.deserialize(file);
    this.statements = this.prepareStatements();

    return { success: true, data: true };
  }

  @SafeExecution
  override close(): Result<boolean> {
    this.vacuum();

    this.db.exec("PRAGMA wal_checkpoint(TRUNCATE)");

    // @ts-expect-error `deserialize` exists in `bun:sqlite` but not in `better-sqlite3`.
    for (const stmt of Object.values(this.statements)) stmt.finalize();

    this.db.close();

    return { success: true, data: true };
  }
}

export type { MiftahValue } from "./types";
export type { Result } from "./types";
export type { PromiseResult } from "./types";
