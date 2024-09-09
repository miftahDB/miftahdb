import DB from "bun:sqlite";
import { BaseMiftahDB } from "./base";

// Intentionally using a type assertion here to align `bun:sqlite`'s `Database` type with `better-sqlite3`.
// Although `bun:sqlite` and `better-sqlite3` have different implementations, their API is similar enough for our purposes.
// This trick helps avoid TypeScript errors while maintaining compatibility across both environments.
// Also run `bun run test` for double-checking.
// import type { Database } from "bun:sqlite";
import type { Database } from "better-sqlite3";

export class MiftahDB extends BaseMiftahDB {
  protected declare db: Database;
  protected initializeDB(path: string | ":memory:"): void {
    this.db = new DB(path) as unknown as Database;
  }
}
